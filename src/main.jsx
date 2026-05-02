import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={err:null};}
  static getDerivedStateFromError(err){return{err};}
  componentDidCatch(err,info){console.error("App crashed:",err,info);}
  render(){
    if(this.state.err){
      return(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",background:"#FAFAF8"}}>
          <div style={{maxWidth:480,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
            <h1 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>Something went wrong</h1>
            <p style={{color:"#555",fontSize:14,marginBottom:20}}>The app hit an unexpected error. Please reload to continue.</p>
            <button onClick={()=>window.location.reload()} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
