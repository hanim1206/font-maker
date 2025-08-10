// src/App.tsx
import { useForm, type SubmitHandler } from 'react-hook-form'
import './App.css'
import { CHOSEONG_MAP, JONGSEONG_MAP, JUNGSEONG_MAP, type JamoData } from './data/Hangul'
import TestD3 from './components/TestD3'
import CurveEditor from './components/CurveEditor'
import { BrowserRouter,Routes,Route,Link} from 'react-router-dom'
import ShapeEditor from './components/ShapeEditor'

export default function App() {

  return (
    <BrowserRouter>
      <div style={{display:"flex",gap:"20px"}}>
        <Link to={"/TestD3"}>TestD3</Link>
        <Link to={"/CurveEditor"}>CurveEditor</Link>
        <Link to={"/ShapeEditor"}>ShapeEditor</Link>
      </div>
   
      <Routes>
        <Route path="/TestD3" element={<TestD3/>}/>
        <Route path="/CurveEditor" element={<CurveEditor/>}/>
        <Route path="/ShapeEditor" element={<ShapeEditor/>}/>
      </Routes>
    </BrowserRouter>
    
  )
}
