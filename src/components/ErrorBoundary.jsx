import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Montserrat,sans-serif",padding:24,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <h2 style={{color:"#1B3A2A",marginBottom:8}}>Something went wrong</h2>
        <p style={{color:"#888",fontSize:14,marginBottom:24}}>حدث خطأ غير متوقع. يرجى تحديث الصفحة.</p>
        <button onClick={()=>window.location.reload()} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Reload / تحديث</button>
        {import.meta.env.DEV && <pre style={{marginTop:24,fontSize:11,color:"#999",textAlign:"left",maxWidth:600,overflow:"auto"}}>{this.state.error?.toString()}</pre>}
      </div>
    );
  }
}
