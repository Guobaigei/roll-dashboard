import { TenantReplyPolicyEditor } from "@/components/operator/TenantReplyPolicyEditor";

type TenantReplyPolicyPageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export default async function TenantReplyPolicyPage({ params }: TenantReplyPolicyPageProps) {
  const { tenantId } = await params;

  return <TenantReplyPolicyEditor tenantId={tenantId} />;
}
