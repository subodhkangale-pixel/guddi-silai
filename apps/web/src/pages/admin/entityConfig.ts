export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'textarea' | 'select';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface EntityConfig {
  title: string;
  path: string;
  queryKey: string;
  fields: FieldConfig[];
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  categories: {
    title: 'Categories',
    path: '/admin/categories',
    queryKey: 'admin-categories',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'slug', label: 'Slug', placeholder: 'auto-generated if empty' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image URL' },
      { key: 'displayOrder', label: 'Display Order', type: 'number' },
    ],
  },
  subcategories: {
    title: 'Sub-categories',
    path: '/admin/subcategories',
    queryKey: 'admin-subcategories',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'categoryId', label: 'Category', type: 'select', required: true, options: [] },
      { key: 'slug', label: 'Slug', placeholder: 'auto-generated if empty' },
    ],
  },
  colors: {
    title: 'Colors',
    path: '/admin/colors',
    queryKey: 'admin-colors',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'hex', label: 'Hex Code', placeholder: 'e.g. #E91E63' },
    ],
  },
  sizes: {
    title: 'Sizes',
    path: '/admin/sizes',
    queryKey: 'admin-sizes',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'code', label: 'Code', placeholder: 'e.g. M' },
    ],
  },
  fibers: {
    title: 'Fibers',
    path: '/admin/fibers',
    queryKey: 'admin-fibers',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  embroidery: {
    title: 'Embroidery',
    path: '/admin/embroidery',
    queryKey: 'admin-embroidery',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'surcharge', label: 'Surcharge', type: 'number' },
      { key: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
};