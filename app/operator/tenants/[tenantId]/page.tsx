import { TenantDetailEditor } from "@/components/operator/TenantDetailEditor";

type TenantDetailPageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { tenantId } = await params;

  return <TenantDetailEditor tenantId={tenantId} />;
}
