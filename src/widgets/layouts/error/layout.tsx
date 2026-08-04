import { Outlet } from 'react-router-dom';

export function ErrorLayout() {
  return (
    <div className="flex h-[95%] grow flex-col items-center justify-center">
      <Outlet />
    </div>
  );
}
