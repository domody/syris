import { ComponentExample } from "@/components/component-example";
import { HomePage } from "@/components/home/home-page";
import { BottomBarPageWrapper } from "@/components/nav/bottom-bar/wrapper";
import { BottomBar } from "@/components/nav/bottom-bar/bottom-bar";


export default function Page() {
  return (
    <BottomBarPageWrapper>
      <HomePage />
      {/* <ComponentExample /> */}
    </BottomBarPageWrapper>


    // <div className="relative w-screen h-screen">
    //   <div className="h-[calc(100vh-4rem)] w-full overflow-x-hidden overflow-y-auto pb-2">
    //     <ComponentExample />
    //   </div>
    //   <BottomBar />
    // </div>
  );
}
