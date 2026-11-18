import { HomePage } from "./pages/HomePage";
import { useApiHealth } from "./hooks/useApiHealth";

export default function App() {
  const health = useApiHealth();
  return <HomePage health={health} />;
}
