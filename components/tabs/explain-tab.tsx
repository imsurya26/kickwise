"use client";

import { ShapFeature } from "@/lib/validation";
import { ShapBreakdown } from "@/components/shap-breakdown";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

interface ExplainTabProps {
  shapFeatures: ShapFeature[];
  tacticalSummary: string;
}

export function ExplainTab({
  shapFeatures,
  tacticalSummary,
}: ExplainTabProps) {
  return (
    <div className="w-full">
      <ShapBreakdown
        shapFeatures={shapFeatures}
        tacticalSummary={tacticalSummary}
      />
    </div>
  );
}
