import api from './client';

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: Pick<Category, 'id' | 'name'> | null;
  children?: Category[];
  isDefault?: boolean;
}

export const isLeafCategory = (category?: Pick<Category, 'parentId'> | null) =>
  !!category?.parentId;

export const buildCategoryPathLabel = (
  categories: Category[] = [],
  categoryId?: string | null,
): string => {
  if (!categoryId) return '';

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const labels: string[] = [];
  const visited = new Set<string>();
  let current = categoryMap.get(categoryId);

  while (current && !visited.has(current.id)) {
    labels.unshift(current.name);
    visited.add(current.id);
    current = current.parentId ? categoryMap.get(current.parentId) : undefined;
  }

  return labels.join(' / ');
};

export const categoryApi = {
  findAll: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
