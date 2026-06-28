import { logoutAction } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-sm font-medium underline cursor-pointer"
        style={{ color: "var(--color-muted)" }}
      >
        Salir
      </button>
    </form>
  );
}
