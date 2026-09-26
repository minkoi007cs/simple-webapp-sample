import { useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Tabs } from 'antd';
import { Building2, User, Bell, Shield, Palette, MoonStar, SunMedium, Sparkles, Save, Lock } from 'lucide-react';
import { useThemeMode } from '../components/theme/ThemeProvider';
import { useSession } from '../components/auth/SessionProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { groupApi } from '../api/group';
import { getGroupRoleDescription, APP_ADMIN_DESCRIPTION } from '../utils/roleDescriptions';
import { MemberList } from './MemberList';
import { CategoryList } from './CategoryList';

export const Settings = () => {
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();
  const { themeMode, setThemeMode } = useThemeMode();
  const queryClient = useQueryClient();
  const { user, role, systemRole, activeGroupId, activeGroupName, memberships, refreshSession, canAccess } = useSession();

  useEffect(() => {
    form.setFieldsValue({
      fullName: user?.fullName || '',
      email: user?.email || '',
      otherNames: user?.otherNames || '',
    });
  }, [form, user]);

  const canViewGroup = Boolean(activeGroupId && (canAccess('GROUP', 'view') || systemRole === 'APP_ADMIN'));
  const canUpdateGroup = Boolean(activeGroupId && (canAccess('GROUP', 'update') || systemRole === 'APP_ADMIN'));
  const canViewMembers = canAccess('USER', 'view');
  const canViewCategories = canAccess('CATEGORY', 'view');

  useEffect(() => {
    groupForm.setFieldsValue({
      groupName: activeGroupName || '',
    });
  }, [groupForm, activeGroupName]);

  const updateProfileMutation = useMutation({
    mutationFn: (values: { fullName?: string; otherNames?: string }) => authApi.updateMe(values),
    onSuccess: async () => {
      await refreshSession();
      message.success('Cập nhật thông tin cá nhân thành công');
    },
    onError: () => {
      message.error('Không thể lưu thông tin. Vui lòng thử lại.');
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (values: { groupName?: string }) => {
      if (!values.groupName) throw new Error('missing-name');
      return groupApi.updateCurrent({ name: values.groupName });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      await refreshSession();
      message.success('Cập nhật tên nhóm thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể cập nhật tên nhóm');
    },
  });

  const profileTab = (
    <div className="space-y-4">
      <Card
        title={<div className="flex items-center gap-2 text-sm font-semibold"><User size={16} /><span>Hồ sơ cá nhân</span></div>}
        className="shadow-xs border-border"
      >
        <Form form={form} layout="vertical" onFinish={(v) => updateProfileMutation.mutate(v)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 p-3 sm:col-span-3 border border-border">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Vai trò hiện tại</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {systemRole === 'APP_ADMIN' && role !== 'APP_ADMIN'
                  ? `${role === 'GROUP_ADMIN' ? 'Quản trị nhóm' : 'Thành viên'} + Quản trị hệ thống`
                  : role === 'GROUP_ADMIN' ? 'Quản trị nhóm'
                  : role === 'MEMBER' ? 'Thành viên'
                  : 'Quản trị hệ thống'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {role === 'GROUP_ADMIN' || role === 'MEMBER' ? getGroupRoleDescription(role) : APP_ADMIN_DESCRIPTION}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Nhóm đang chọn</p>
              <p className="mt-1 text-sm font-bold text-foreground">{activeGroupName || 'Chưa chọn'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Số nhóm đã tham gia</p>
              <p className="mt-1 text-sm font-bold text-foreground">{memberships.length}</p>
            </div>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Save size={15} />}
            loading={updateProfileMutation.isPending}
          >
            Lưu thay đổi
          </Button>
        </Form>
      </Card>

      <Card
        title={<div className="flex items-center gap-2 text-sm font-semibold"><Shield size={16} /><span>Bảo mật tài khoản</span></div>}
        className="shadow-xs border-border"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Đăng nhập được xác thực an toàn qua Google OAuth.</p>
          <Button disabled icon={<Lock size={15} />}>
            Quản lý bởi Google
          </Button>
        </div>
      </Card>
    </div>
  );

  const groupTab = canViewGroup ? (
    <div className="space-y-4">
      <Card
        title={<div className="flex items-center gap-2 text-sm font-semibold"><Building2 size={16} /><span>Thông tin Nhóm làm việc</span></div>}
        className="shadow-xs border-border"
      >
        <Form form={groupForm} layout="vertical" onFinish={(values) => updateGroupMutation.mutate(values)}>
          <Form.Item label="Tên nhóm làm việc" name="groupName" rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}>
            <Input placeholder="Nhập tên nhóm" disabled={!canUpdateGroup} />
          </Form.Item>
          <div className="mb-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Nhóm hiện tại</p>
              <p className="mt-1 text-sm font-bold text-foreground">{activeGroupName || 'Chưa đặt tên'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Trạng thái</p>
              <p className="mt-1 text-sm font-bold text-foreground">Đang hoạt động</p>
            </div>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Save size={15} />}
            loading={updateGroupMutation.isPending}
            disabled={!canUpdateGroup}
          >
            Lưu tên nhóm
          </Button>
        </Form>
      </Card>
    </div>
  ) : (
    <p className="text-xs text-muted-foreground p-4">Bạn chưa tham gia nhóm nào.</p>
  );

  const appearanceTab = (
    <div className="space-y-4">
      <Card
        title={<div className="flex items-center gap-2 text-sm font-semibold"><Palette size={16} /><span>Giao diện</span></div>}
        className="shadow-xs border-border"
      >
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">Chế độ tối (Dark Mode)</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Chuyển đổi giữa giao diện sáng và tối.</p>
            </div>
            <Switch
              checked={themeMode === 'dark'}
              onChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-lg border p-3 transition-all ${themeMode === 'light' ? 'border-primary ring-2 ring-primary/20 bg-card' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center gap-2 text-foreground">
                <SunMedium size={16} />
                <span className="text-xs font-semibold">Giao diện sáng</span>
              </div>
            </div>

            <div className={`rounded-lg border p-3 transition-all ${themeMode === 'dark' ? 'border-primary ring-2 ring-primary/20 bg-card' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center gap-2 text-foreground">
                <MoonStar size={16} />
                <span className="text-xs font-semibold">Giao diện tối</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles size={14} className="text-primary" />
            <span>Giao diện được áp dụng ngay lập tức trên toàn bộ ứng dụng.</span>
          </div>
        </div>
      </Card>

      <Card
        title={<div className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} /><span>Thông báo</span></div>}
        className="shadow-xs border-border"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-sm">Thông báo qua Email</p>
              <p className="text-xs text-muted-foreground">Nhận thông báo khi có cập nhật trong nhóm</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    { key: 'profile', label: 'Cá nhân', children: profileTab },
    { key: 'group', label: 'Nhóm làm việc', children: groupTab },
    ...(canViewMembers ? [{ key: 'members', label: 'Thành viên', children: <MemberList /> }] : []),
    ...(canViewCategories ? [{ key: 'categories', label: 'Phân loại', children: <CategoryList /> }] : []),
    { key: 'appearance', label: 'Giao diện & Cài đặt', children: appearanceTab },
  ];

  return (
    <div className="space-y-4 max-w-5xl animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Cài Đặt</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Quản lý hồ sơ, cấu hình nhóm và giao diện ứng dụng</p>
      </header>

      <Tabs items={tabItems} className="settings-tabs" />
    </div>
  );
};
