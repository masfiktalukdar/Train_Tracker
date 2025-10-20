export default function Footer(){
  return(
    <div className="bg-primary-200 w-full h-12 flex justify-center items-center">
      <h1>&copy; {new Date().getFullYear()} TrainTracker. All rights reserved.</h1>
    </div>
  )
}