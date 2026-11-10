import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Log in | Pickleball Slots HK" };

export default function Page() {
  return <LoginForm audience="player" />;
}
