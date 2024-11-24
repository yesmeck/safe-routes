import type { Route} from './+types/route';

export default function Component({ params }: Route.ComponentProps) {
  return <div>show {params.id}</div>
}
