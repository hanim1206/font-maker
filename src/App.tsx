// src/App.tsx
import { useForm, type SubmitHandler } from 'react-hook-form'
import './App.css'
import { CHOSEONG_MAP, JONGSEONG_MAP, JUNGSEONG_MAP, type JamoData } from './data/Hangul'
import TestD3 from './components/TestD3'
import CurveEditor from './components/CurveEditor'
import { BrowserRouter,Routes,Route,Link} from 'react-router-dom'

export default function App() {

  return (
    <BrowserRouter>
      <div style={{display:"flex",gap:"20px"}}>
        <Link to={"/testD3"}>TestD3</Link>
        <Link to={"/editor"}>CurveEditor</Link>
      </div>
   
      <Routes>
        <Route path="/testD3" element={<TestD3/>}/>
        <Route path="/editor" element={<CurveEditor/>}/>
      </Routes>
    </BrowserRouter>
    
  )
}
