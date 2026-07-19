import { DashApp } from "./_components/DashApp";
import { AuthGate } from "./_components/AuthGate";
import "./dashboard.css";

export default function AriesHomePage() {
  return (
    <AuthGate>
      <DashApp />
    </AuthGate>
  );
}
