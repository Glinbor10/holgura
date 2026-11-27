import { ButtonBase, Stack, Typography } from '@mui/material';
import type { Category } from '../domain/types';
import { CategoryBadge } from '../routes/shared';

interface CategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}

/** Row of category icons; the selected one gets a ring. */
export const CategoryPicker = ({ categories, value, onChange }: CategoryPickerProps) => (
  <Stack direction="row" sx={{ gap: 1.5, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
    {categories.map((category) => (
      <ButtonBase
        key={category.id}
        onClick={() => onChange(category.id)}
        aria-pressed={category.id === value}
        sx={{
          flexDirection: 'column',
          gap: 0.75,
          width: 76,
          flexShrink: 0,
          py: 1,
          borderRadius: '18px',
          outline: category.id === value ? '2px solid var(--mui-palette-primary-main)' : '2px solid transparent',
          bgcolor: category.id === value ? 'action.hover' : 'transparent',
        }}
      >
        <CategoryBadge name={category.name} size={46} />
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{category.name}</Typography>
      </ButtonBase>
    ))}
  </Stack>
);
