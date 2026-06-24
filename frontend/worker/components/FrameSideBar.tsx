import type { ComponentChildren } from "preact";

interface SideButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: ComponentChildren;
}

export function SideButton({ onClick, disabled, title, children }: SideButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function FrameSideBar({ children }: { children: ComponentChildren }) {
  return (
    <div class="flex flex-col items-center gap-1 py-1">
      {children}
    </div>
  );
}
