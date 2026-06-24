import { AccordionMenuItem } from '@/shared/ui/atoms/accordion-menu';
import { SearchSettingsItem } from './types';

export function SearchSettingsItems({
  items,
}: {
  items: SearchSettingsItem[];
}) {
  return (
    <>
      {items.map((item) => (
        <AccordionMenuItem key={item.info} value={item.info}>
          <item.icon size={16} />
          <span>{item.info}</span>
        </AccordionMenuItem>
      ))}
    </>
  );
}
