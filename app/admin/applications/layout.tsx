import { Suspense, type ReactNode } from "react";
import { PageHeader } from "../ui";
import Tabs, { TabsView } from "./tabs";

export default function ApplicationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Applications" description="Officer applications from the membership form." />
      <Suspense fallback={<TabsView pathname="" />}>
        <Tabs />
      </Suspense>
      {children}
    </>
  );
}
