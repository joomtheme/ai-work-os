export type MissionDetailProps = {
  id: string;
  title: string;
  status: string;
};

export function MissionDetail({ id, title, status }: MissionDetailProps) {
  return {
    id,
    title,
    status,
  };
}
