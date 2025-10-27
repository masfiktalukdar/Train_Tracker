import { RoundedBlinkingButton } from "@/components/button"
import Footer from "@/components/footer"

function blinkingBtnAction(){
  console.log("everyting is working")
}

export default function AdminStationRoutes(){
  return(
    <div className="w-full min-h-full bg-primary-100 flex-1 flex flex-col">
        <RoundedBlinkingButton onClick={blinkingBtnAction}/>
      {/* Footer Section */}
      <Footer/>
    </div>
  )
}
