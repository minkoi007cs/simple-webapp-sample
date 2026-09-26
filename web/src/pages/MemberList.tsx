import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Avatar, Spin, Card } from 'antd';
import { UserPlus, Shield, Copy, Mail, Users, Check, Trash2, Link2, CopyPlus } from 'lucide-react';
import { userApi, type User } from '../api/user';
import { useSession } from '../components/auth/SessionProvider';
import { asPaginatedList } from '../api/client';

const MEMBER_PAGE_SIZE = 15;

export const MemberList = () => {
  const queryClient = useQueryClient();
  const { role, canAccess } = useSession();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const {
    data: memberInfinite,
    isPending: membersLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['members', 'infinite'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      userApi
        .findAll({ page: pageParam, pageSize: MEMBER_PAGE_SIZE })
        .then((res) => asPaginatedList(res.data)),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const members = useMemo(
    () => memberInfinite?.pages.flatMap((p) => p.items) ?? [],
    [memberInfinite],
  );

  const onMemberTableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const inviteMutation = useMutation({
    mutationFn: (values: { email: string; role: string; fullName: string }) =>
      userApi.invite(values.email, values.role, values.fullName),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setInviteLink(`${window.location.origin}/accept-invite?token=${res.data.token}`);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể tạo lời mời. Vui lòng kiểm tra email.');
    },
  });

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    message.success('Đã sao chép liên kết lời mời');
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteLink(null);
    form.resetFields();
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('Đã cập nhật thông tin thành viên');
      setIsEditModalOpen(false);
      setEditingUser(null);
      editForm.resetFields();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('Đã cập nhật vai trò');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      message.success('Đã xóa thành viên khỏi nhóm');
    },
  });

  const handleEdit = (user: User) => {
    if (role !== 'GROUP_ADMIN') {
      return;
    }
    setEditingUser(user);
    editForm.setFieldsValue(user);
    setIsEditModalOpen(true);
  };

  const canManageMembers = role === 'GROUP_ADMIN' && canAccess('USER', 'update');

  const openInviteFromMemberCopy = (record: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageMembers) return;
    form.resetFields();
    form.setFieldsValue({
      fullName: record.fullName || '',
      email: '',
      role: record.role || 'MEMBER',
    });
    setIsInviteModalOpen(true);
  };

  const columns = [
    {
      title: 'Thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: User) => (
        <Space>
          <Avatar className="bg-primary/10 text-primary font-bold">
            {text?.charAt(0) || record.email.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium text-foreground">{text || 'Đang chờ...'}</div>
            <div className="text-xs text-muted-foreground">{record.email}</div>
          </div>
        </Space>
      ),
      sorter: (a: User, b: User) => (a.fullName || a.email || '').localeCompare(b.fullName || b.email || ''),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Select
            value={role}
            size="small"
            className="w-32"
            disabled={!canManageMembers}
            onChange={(val) => updateRoleMutation.mutate({ id: record.id, role: val })}
            options={[
              { value: 'GROUP_ADMIN', label: 'Quản trị nhóm' },
              { value: 'MEMBER', label: 'Thành viên' },
            ]}
          />
        </span>
      ),
      sorter: (a: User, b: User) => (a.role || '').localeCompare(b.role || ''),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { ACTIVE: 'green', INVITED: 'orange', REMOVED: 'red' };
        const labels: Record<string, string> = {
          ACTIVE: 'Hoạt động',
          INVITED: 'Đã mời',
          REMOVED: 'Đã xóa',
        };
        return <Tag color={colors[status] || 'blue'}>{labels[status] || status}</Tag>;
      },
      sorter: (a: User, b: User) => (a.status || '').localeCompare(b.status || ''),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, record: User) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            disabled={!canManageMembers}
            icon={<CopyPlus size={15} />}
            title="Mời thêm thành viên với vai trò tương tự"
            aria-label="Mời thêm thành viên"
            onClick={(e) => openInviteFromMemberCopy(record, e)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Thành Viên Nhóm</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý các thành viên và phân quyền trong nhóm làm việc
          </p>
        </div>
        {canManageMembers && (
          <Button
            type="primary"
            icon={<UserPlus size={16} />}
            onClick={() => {
              form.resetFields();
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            Mời Thành Viên
          </Button>
        )}
      </div>

      <Card className="shadow-xs border-border" bodyStyle={{ padding: '16px' }}>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={members}
            loading={membersLoading}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleEdit(record),
              style: { cursor: canManageMembers ? 'pointer' : 'default' }
            })}
            scroll={{ x: 600, y: 'calc(100vh - 280px)' }}
            size="middle"
            pagination={false}
            onScroll={onMemberTableScroll}
            locale={{ emptyText: 'Chưa có thành viên nào trong nhóm' }}
          />
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Spin size="small" />
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="Chỉnh sửa thông tin thành viên"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate({ id: editingUser!.id, data: values })}
          className="mt-4"
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<Users size={16} className="text-muted-foreground mr-1" />} />
          </Form.Item>

          <div className="flex justify-between items-center mt-6">
            {editingUser && canManageMembers ? (
              <Button
                danger
                icon={<Trash2 size={16} />}
                loading={removeMutation.isPending}
                onClick={() => {
                  Modal.confirm({
                    title: 'Xác nhận xóa thành viên',
                    content: `Bạn có chắc chắn muốn xóa "${editingUser.fullName || editingUser.email}" khỏi nhóm làm việc?`,
                    okText: 'Xóa khỏi nhóm',
                    cancelText: 'Hủy',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      removeMutation.mutate(editingUser.id, {
                        onSuccess: () => {
                          setIsEditModalOpen(false);
                          setEditingUser(null);
                          editForm.resetFields();
                        },
                      });
                    },
                  });
                }}
              >
                Xóa khỏi nhóm
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title={inviteLink ? 'Liên kết lời mời đã tạo' : 'Mời thành viên mới'}
        open={isInviteModalOpen}
        onCancel={closeInviteModal}
        footer={null}
        destroyOnClose
      >
        {inviteLink ? (
          <div className="mt-4 space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
              <Check size={18} className="shrink-0" />
              <p>Gửi liên kết này cho người được mời. Họ chỉ cần đăng nhập Google để tham gia nhóm.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Link2 size={16} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs font-mono text-foreground">{inviteLink}</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button icon={<Copy size={16} />} onClick={copyInviteLink}>
                Sao chép liên kết
              </Button>
              <Button type="primary" onClick={closeInviteModal}>
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => inviteMutation.mutate(values)}
            className="mt-4"
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
            >
              <Input prefix={<Users size={16} className="text-muted-foreground mr-1" />} placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input prefix={<Mail size={16} className="text-muted-foreground mr-1" />} placeholder="member@example.com" />
            </Form.Item>
            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true }]}
              initialValue="MEMBER"
            >
              <Select options={[
                { value: 'GROUP_ADMIN', label: 'Quản trị nhóm (Toàn quyền quản lý)' },
                { value: 'MEMBER', label: 'Thành viên (Quyền tiêu chuẩn)' },
              ]} />
            </Form.Item>
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex gap-3 text-blue-600 dark:text-blue-400 text-xs mb-4">
              <Shield size={16} className="shrink-0" />
              <p>Người dùng nhận link mời sẽ xác thực đăng nhập an toàn bằng tài khoản Google.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={closeInviteModal}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={inviteMutation.isPending}
              >
                Tạo lời mời
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};
