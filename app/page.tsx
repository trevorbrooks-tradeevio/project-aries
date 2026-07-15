import { DashApp } from "./_components/DashApp";
import { PasswordGate } from "./_components/PasswordGate";
import "./dashboard.css";

export default function AriesHomePage() {
  return (
    <PasswordGate>
      <DashApp />
    </PasswordGate>
  );
}
