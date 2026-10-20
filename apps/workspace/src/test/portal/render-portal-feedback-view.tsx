import { render } from "@testing-library/react";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { FeedbackPageView } from "@/components/portal/feedback/feedback-page-view/feedback-page-view";
import {
  getPortalFeedbackDictionary,
  getPortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { portalProjectFeedback } from "@/test/fixtures/portal-feedback";

export function renderPortalFeedbackView(
  dto: PortalProjectFeedbackDto = portalProjectFeedback(),
  canUpload = false,
) {
  const content = getPortalFeedbackDictionary("en");
  const filesContent = getPortalFilesDictionary("en");
  return render(
    <FeedbackPageView
      canUpload={canUpload}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      dashboardHref="/en/portal/customer-1"
      feedback={dto}
      filesContent={filesContent}
      locale="en"
      messagesHref="/en/portal/customer-1?chat=open"
    />,
  );
}
