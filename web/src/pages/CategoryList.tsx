import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, message, Select, Popconfirm, Card } from 'antd';
import { Plus, FolderTree, Edit2, Trash2, FolderPlus } from 'lucide-react';
import {
  buildCategoryPathLabel,
  categoryApi,
  type Category,
} from '../api/category';
import { useSession } from '../components/auth/SessionProvider';

export const CategoryList = () => {
  const queryClient = useQueryClient();
  const { canAccess } = useSession();
  const canEdit = canAccess('CATEGORY', 'update') || canAccess('CATEGORY', 'create');
  const canDelete = canAccess('CATEGORY', 'delete');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.findAll().then((res) => res.data),
  });

  const categoryTree = useMemo(() => {
    const source = categories ?? [];
    const nodeMap = new Map<string, Category & { key: string; children: Category[] }>();

    source.forEach((category) => {
      nodeMap.set(category.id, {
        ...category,
        key: category.id,
        children: [] as Category[],
      });
    });

    const roots: Array<Category & { key: string; children: Category[] }> = [];

    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Remove empty children arrays so antd doesn't render expand icon on leaves
    nodeMap.forEach((node) => {
      if ((node.children as Category[]).length === 0) {
        (node as any).children = undefined;
      }
    });

    return roots;
  }, [categories]);

  const parentOptions = useMemo(() => {
    return (categories ?? [])
      .filter((category) => !category.parentId && category.id !== editingCategory?.id)
      .map((category) => ({
        value: category.id,
        label: buildCategoryPathLabel(categories ?? [], category.id),
      }));
  }, [categories, editingCategory]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      message.success('Tạo phân loại thành công');
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể tạo phân loại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.update(editingCategory!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      message.success('Cập nhật phân loại thành công');
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể cập nhật phân loại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      message.success('Xóa phân loại thành công');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể xóa phân loại');
    },
  });

  const handleOpenCreate = (parentId?: string) => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parentId || undefined });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: Category) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      parentId: record.parentId ?? undefined,
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Tên phân loại',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => (
        <Space>
          <FolderTree size={16} className={!record.parentId ? 'text-primary' : 'text-muted-foreground'} />
          <span className={!record.parentId ? 'font-semibold text-foreground' : 'text-foreground'}>{text}</span>
        </Space>
      ),
      sorter: (a: Category, b: Category) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Category) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          {!record.parentId && canEdit && (
            <Button
              type="text"
              size="small"
              icon={<FolderPlus size={15} />}
              title="Thêm danh mục con"
              onClick={() => handleOpenCreate(record.id)}
            />
          )}
          {canEdit && (
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={15} />}
              title="Chỉnh sửa"
              onClick={() => handleOpenEdit(record)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Xác nhận xóa phân loại"
              description="Bạn có chắc chắn muốn xóa phân loại này?"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" icon={<Trash2 size={15} />} title="Xóa" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Phân Loại Mẫu (Categories)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý cây phân loại và danh mục nhóm mẫu
          </p>
        </div>
        {canEdit && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5"
          >
            Thêm Phân Loại
          </Button>
        )}
      </div>

      <Card className="shadow-xs border-border" bodyStyle={{ padding: '16px' }}>
        {isError && (
          <div className="mb-3 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm">
            Không thể tải danh sách phân loại. Vui lòng thử lại.
          </div>
        )}
        <Table
          columns={columns}
          dataSource={categoryTree}
          loading={isLoading}
          rowKey="id"
          defaultExpandAllRows
          pagination={false}
          locale={{ emptyText: 'Chưa có phân loại nào trong nhóm' }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Chỉnh sửa Phân Loại' : 'Thêm Phân Loại Mới'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              ...values,
              parentId: values.parentId || null,
            };
            if (editingCategory) {
              updateMutation.mutate(payload);
            } else {
              createMutation.mutate(payload);
            }
          }}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Tên phân loại"
            rules={[{ required: true, message: 'Vui lòng nhập tên phân loại' }]}
          >
            <Input placeholder="Ví dụ: Vải sợi, Phụ kiện..." />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="Phân loại cha (Tùy chọn)"
            extra="Để trống nếu là nhóm phân loại gốc."
          >
            <Select
              allowClear
              placeholder="Chọn nhóm cha"
              options={parentOptions}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-5">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
