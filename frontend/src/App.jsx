import React from "react";
import { useEffect, useMemo, useState } from "react";
import { ChefHat, Heart, ShoppingBasket, LogIn, LogOut, ClipboardList, LayoutDashboard, Utensils, Plus, Minus, CheckCircle, Clock, Truck, Leaf } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const blankQty = { chapati:4, rice:1, dal:1, sabzi:1 };
const money = n => `₹${Number(n || 0).toFixed(0)}`;

export default function App() {
  const [token,setToken] = useState(localStorage.getItem("mfk_token") || "");
  const [user,setUser] = useState(JSON.parse(localStorage.getItem("mfk_user") || "null"));
  const [menus,setMenus] = useState([]);
  const [orders,setOrders] = useState([]);
  const [tab,setTab] = useState("home");
  const [selectedDay,setSelectedDay] = useState(DAYS[0]);
  const [qty,setQty] = useState(blankQty);
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [authMode,setAuthMode] = useState("login");
  const [auth,setAuth] = useState({name:"",email:"",password:""});
  const [checkout,setCheckout] = useState({address:"",phone:"",deliveryDate:new Date().toISOString().slice(0,10),paymentMethod:"COD",upiReference:""});
  const [adminEdit,setAdminEdit] = useState(null);

  const request = async (path, options={}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(options.headers || {}) }
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  };

  const loadMenus = async () => {
    try { const d = await request("/menu"); setMenus(d.menus || []); }
    catch(e) { setMessage(e.message + " Make sure the backend and MongoDB are running."); }
  };
  const loadOrders = async () => {
    if (!token) return;
    try {
      const d = await request(user?.role === "admin" ? "/orders/admin/all" : "/orders/mine");
      setOrders(d.orders || []);
    } catch(e) { setMessage(e.message); }
  };
  useEffect(()=>{ loadMenus(); },[]);
  useEffect(()=>{ loadOrders(); },[token,user?.role]);

  const menu = menus.find(m=>m.day===selectedDay);
  const total = useMemo(()=>menu ? Object.keys(qty).reduce((s,k)=>s + qty[k] * menu.prices[k],0) : 0,[menu,qty]);
  const saveSession = data => {
    localStorage.setItem("mfk_token",data.token); localStorage.setItem("mfk_user",JSON.stringify(data.user));
    setToken(data.token); setUser(data.user); setTab(data.user.role==="admin"?"admin":"home"); setMessage(`Welcome, ${data.user.name}!`);
  };
  const logout = () => { localStorage.removeItem("mfk_token"); localStorage.removeItem("mfk_user"); setToken(""); setUser(null); setOrders([]); setTab("home"); setMessage("You have logged out."); };

  const submitAuth = async e => {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const d = await request(`/auth/${authMode}`,{method:"POST",body:JSON.stringify(auth)});
      saveSession(d);
    } catch(e) { setMessage(e.message); }
    finally { setBusy(false); }
  };
  const placeOrder = async e => {
    e.preventDefault();
    if (!token) { setMessage("Please log in or create an account before ordering."); setTab("account"); return; }
    setBusy(true); setMessage("");
    try {
      const d = await request("/orders",{method:"POST",body:JSON.stringify({...checkout,day:selectedDay,quantities:qty})});
      setMessage(d.message); setQty(blankQty); setTab("orders"); await loadOrders();
    } catch(e) { setMessage(e.message); }
    finally { setBusy(false); }
  };
  const startEdit = m => setAdminEdit(JSON.parse(JSON.stringify(m)));
  const saveMenu = async e => {
    e.preventDefault();
    try {
      await request(`/menu/${adminEdit.day}`,{method:"PUT",body:JSON.stringify(adminEdit)});
      setMessage(`${adminEdit.day} menu saved.`); setAdminEdit(null); await loadMenus();
    } catch(e) { setMessage(e.message); }
  };
  const decide = async (order,decision) => {
    const estimatedDelivery = decision==="Approved" ? (prompt("Estimated delivery time (e.g. 1:30 PM):",order.estimatedDelivery || "1:30 PM") || "") : "";
    const adminNote = decision==="Rejected" ? (prompt("Reason for rejection (optional):","") || "") : "";
    try { await request(`/orders/${order._id}/decision`,{method:"PATCH",body:JSON.stringify({decision,estimatedDelivery,adminNote})}); setMessage(`Order ${decision.toLowerCase()}.`); await loadOrders(); await loadMenus(); }
    catch(e) { setMessage(e.message); }
  };
  const updateStatus = async (order,status) => {
    const estimatedDelivery = status==="Out for delivery" ? (prompt("Delivery time:",order.estimatedDelivery || "1:30 PM") || order.estimatedDelivery) : order.estimatedDelivery;
    try { await request(`/orders/${order._id}/status`,{method:"PATCH",body:JSON.stringify({status,estimatedDelivery})}); setMessage("Order updated."); await loadOrders(); }
    catch(e) { setMessage(e.message); }
  };

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#" onClick={()=>setTab("home")}><span className="brandIcon"><ChefHat size={28}/></span><span><strong>Mom's Food Kitchen</strong><small>Homemade Food... With Love ❤️</small></span></a>
      <nav>
        <button className={tab==="home"?"active":""} onClick={()=>setTab("home")}>Home</button>
        <button className={tab==="menu"?"active":""} onClick={()=>setTab("menu")}>Menu</button>
        {token && <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>My Orders</button>}
        {user?.role==="admin" && <button className={tab==="admin"?"active":""} onClick={()=>setTab("admin")}>Admin</button>}
      </nav>
      <div className="accountActions">
        {user ? <><span className="welcome">Hi, {user.name.split(" ")[0]}</span><button className="outline small" onClick={logout}><LogOut size={15}/> Logout</button></> :
          <button className="primary small" onClick={()=>setTab("account")}><LogIn size={15}/> Login / Sign up</button>}
      </div>
    </header>

    {message && <div className="notice"><span>{message}</span><button onClick={()=>setMessage("")}>×</button></div>}

    {tab==="home" && <><section className="hero">
      <div className="heroCopy"><span className="eyebrow">FRESH • HOMEMADE • MADE WITH LOVE</span><h1>A little taste of<br/><em>home, every day.</em></h1><p>Wholesome tiffins, freshly prepared and delivered with care.</p><button className="primary" onClick={()=>setTab("menu")}>Explore this week's menu <span>→</span></button></div>
      <div className="heroPhoto"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=85" alt="Homemade Indian thali"/></div>
    </section>
    <section className="featureRow"><div><Leaf/><b>Freshly prepared</b><span>Homemade meals daily</span></div><div><Heart/><b>Made with love</b><span>Simple, comforting food</span></div><div><Truck/><b>Home delivery</b><span>Delivery time confirmed by us</span></div></section>
    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">WHAT'S COOKING?</span><h2>This week's menu</h2></div><button className="textButton" onClick={()=>setTab("menu")}>View full menu →</button></div><div className="dayGrid">{menus.slice(0,7).map(m=><button className="dayCard" key={m.day} onClick={()=>{setSelectedDay(m.day);setTab("menu");}}><span>{m.day}</span><strong>{m.items?.sabzi}</strong><small>{m.availableTiffins} tiffins available</small></button>)}</div></section></>}

    {tab==="menu" && <main className="section"><div className="sectionHeading"><div><span className="eyebrow">PLAN YOUR MEAL</span><h2>Choose your tiffin</h2><p>Pick a day, then make it just the way you like.</p></div></div>
      <div className="menuLayout"><div className="panel dayPicker"><h3>Weekly menu</h3>{DAYS.map(day=>{const m=menus.find(x=>x.day===day);return <button key={day} className={selectedDay===day?"dayChoice selected":"dayChoice"} onClick={()=>setSelectedDay(day)}><span>{day}</span><small>{m?.items?.sabzi || "Menu coming soon"}</small></button>;})}</div>
      <div className="panel customize"><div className="menuTop"><div><span className="eyebrow">{selectedDay.toUpperCase()}</span><h3>{menu?.items?.description || "Fresh homemade tiffin"}</h3><p>{menu ? `${menu.items.chapati}, ${menu.items.rice}, ${menu.items.dal}, ${menu.items.sabzi}` : "Loading menu..."}</p></div><div className="stockPill">{menu?.availableTiffins ?? "—"} available</div></div>
        {!menu?.active && <p className="muted">Ordering is currently closed for this day.</p>}
        {["chapati","rice","dal","sabzi"].map(k=><div className="quantityRow" key={k}><div><b>{menu?.items?.[k] || k}</b><small>{money(menu?.prices?.[k] || 0)} each</small></div><div className="stepper"><button onClick={()=>setQty(q=>({...q,[k]:Math.max(0,q[k]-1)}))}><Minus size={15}/></button><strong>{qty[k]}</strong><button onClick={()=>setQty(q=>({...q,[k]:Math.min(20,q[k]+1)}))}><Plus size={15}/></button></div></div>)}
        <div className="totalBar"><span>Estimated total</span><strong>{money(total)}</strong></div>
      </div>
      <form className="panel checkout" onSubmit={placeOrder}><h3>Delivery details</h3><label>Delivery date<input type="date" required min={new Date().toISOString().slice(0,10)} value={checkout.deliveryDate} onChange={e=>setCheckout({...checkout,deliveryDate:e.target.value})}/></label><label>Phone number<input value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})} placeholder="Your contact number"/></label><label>Delivery address<textarea required value={checkout.address} onChange={e=>setCheckout({...checkout,address:e.target.value})} placeholder="House number, street, area"/></label><label>Payment method<select value={checkout.paymentMethod} onChange={e=>setCheckout({...checkout,paymentMethod:e.target.value})}><option value="COD">Cash on Delivery</option><option value="UPI">UPI (manual payment)</option></select></label>{checkout.paymentMethod==="UPI" && <label>UPI reference / UTR (if paid)<input value={checkout.upiReference} onChange={e=>setCheckout({...checkout,upiReference:e.target.value})} placeholder="Enter transaction reference"/></label>}<p className="hint">Your order remains pending until the kitchen approves availability.</p><button className="primary full" disabled={busy || !menu?.active}>{busy?"Placing order...":`Place order • ${money(total)}`}</button></form></div>
    </main>}

    {tab==="account" && <main className="authWrap"><form className="panel authCard" onSubmit={submitAuth}><span className="eyebrow">WELCOME TO OUR KITCHEN</span><h2>{authMode==="login"?"Welcome back":"Create your account"}</h2>{authMode==="register" && <label>Your name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})}/></label>}<label>Email<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label><label>Password<input type="password" minLength="8" required value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label><button className="primary full" disabled={busy}>{busy?"Please wait...":authMode==="login"?"Login":"Create account"}</button><p className="switchAuth">{authMode==="login"?"New here?":"Already have an account?"} <button type="button" onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"Create an account":"Login"}</button></p></form></main>}

    {tab==="orders" && <main className="section"><div className="sectionHeading"><div><span className="eyebrow">YOUR MEALS</span><h2>My orders</h2></div><button className="outline" onClick={loadOrders}>Refresh</button></div>{orders.length===0?<div className="empty panel">No orders yet. Choose something delicious from the weekly menu.</div>:<div className="orderList">{orders.map(o=><OrderCard key={o._id} order={o}/>)}</div>}</main>}

    {tab==="admin" && user?.role==="admin" && <main className="section"><div className="sectionHeading"><div><span className="eyebrow">KITCHEN CONTROL</span><h2>Admin dashboard</h2><p>Review requests, manage availability and update your menu.</p></div><button className="outline" onClick={()=>{loadOrders();loadMenus();}}>Refresh data</button></div>
      <div className="stats"><div className="panel"><small>Total orders</small><strong>{orders.length}</strong></div><div className="panel"><small>Waiting approval</small><strong>{orders.filter(o=>o.status==="Pending").length}</strong></div><div className="panel"><small>Approved</small><strong>{orders.filter(o=>o.status!=="Pending"&&o.status!=="Rejected").length}</strong></div></div>
      <div className="adminGrid"><div className="panel"><h3>Weekly menu & stock</h3>{menus.map(m=><div className="adminMenuRow" key={m.day}><div><b>{m.day}</b><small>{m.items?.sabzi} • {m.availableTiffins} available</small></div><button className="outline small" onClick={()=>startEdit(m)}>Edit</button></div>)}</div>
      <div className="panel"><h3>Customer orders</h3>{orders.length===0?<p className="muted">No orders received yet.</p>:orders.map(o=><div className="adminOrder" key={o._id}><div className="orderHead"><b>{o.customerName}</b><span className={`status ${o.status.toLowerCase().replaceAll(" ","-")}`}>{o.status}</span></div><p>{o.day} • {o.deliveryDate} • {money(o.total)}</p><p className="muted">{o.quantities.chapati} chapati · {o.quantities.rice} rice · {o.quantities.dal} dal · {o.quantities.sabzi} sabzi</p><p className="muted">{o.address} {o.phone && `• ${o.phone}`}</p><p className="muted">Payment: {o.paymentMethod} / {o.paymentStatus}</p>{o.estimatedDelivery && <p>Delivery: {o.estimatedDelivery}</p>}{o.adminNote && <p>Note: {o.adminNote}</p>}
      {o.status==="Pending" && <div className="buttonRow"><button className="primary small" onClick={()=>decide(o,"Approved")}>Approve</button><button className="danger small" onClick={()=>decide(o,"Rejected")}>Reject</button></div>}
      {o.status==="Approved" && <button className="outline small" onClick={()=>updateStatus(o,"Preparing")}>Mark preparing</button>}
      {o.status==="Preparing" && <button className="outline small" onClick={()=>updateStatus(o,"Out for delivery")}>Out for delivery</button>}
      {o.status==="Out for delivery" && <button className="outline small" onClick={()=>updateStatus(o,"Delivered")}>Mark delivered</button>}
      </div>)}</div></div>
      {adminEdit && <div className="modalBackdrop"><form className="panel editModal" onSubmit={saveMenu}><div className="sectionHeading"><h3>Edit {adminEdit.day}</h3><button type="button" className="textButton" onClick={()=>setAdminEdit(null)}>Close ×</button></div><label>Sabzi / menu description<input value={adminEdit.items.sabzi} onChange={e=>setAdminEdit({...adminEdit,items:{...adminEdit.items,sabzi:e.target.value}})}/></label><label>Chapati item<input value={adminEdit.items.chapati} onChange={e=>setAdminEdit({...adminEdit,items:{...adminEdit.items,chapati:e.target.value}})}/></label><label>Rice item<input value={adminEdit.items.rice} onChange={e=>setAdminEdit({...adminEdit,items:{...adminEdit.items,rice:e.target.value}})}/></label><label>Dal item<input value={adminEdit.items.dal} onChange={e=>setAdminEdit({...adminEdit,items:{...adminEdit.items,dal:e.target.value}})}/></label><label>Description<input value={adminEdit.items.description || ""} onChange={e=>setAdminEdit({...adminEdit,items:{...adminEdit.items,description:e.target.value}})}/></label><div className="twoCol">{["chapati","rice","dal","sabzi"].map(k=><label>{k} price<input type="number" min="0" value={adminEdit.prices[k]} onChange={e=>setAdminEdit({...adminEdit,prices:{...adminEdit.prices,[k]:Number(e.target.value)}})}/></label>)}</div><label>Available tiffins<input type="number" min="0" step="1" value={adminEdit.availableTiffins} onChange={e=>setAdminEdit({...adminEdit,availableTiffins:Number(e.target.value)})}/></label><label className="checkLabel"><input type="checkbox" checked={adminEdit.active} onChange={e=>setAdminEdit({...adminEdit,active:e.target.checked})}/> Accept orders for this day</label><button className="primary full">Save menu</button></form></div>}
    </main>}

    <footer><div className="footerBrand"><ChefHat/><b>Mom's Food Kitchen</b></div><p>Homemade food, made with love. ❤️</p><small>© {new Date().getFullYear()} Mom's Food Kitchen</small></footer>
  </div>;
}

function OrderCard({order:o}) {
  return <article className="panel orderCard"><div className="orderHead"><div><span className="eyebrow">ORDER #{o._id.slice(-6).toUpperCase()}</span><h3>{o.day} • {o.deliveryDate}</h3></div><span className={`status ${o.status.toLowerCase().replaceAll(" ","-")}`}>{o.status}</span></div><p>{o.quantities.chapati} chapati · {o.quantities.rice} rice · {o.quantities.dal} dal · {o.quantities.sabzi} sabzi</p><div className="orderFoot"><b>{money(o.total)}</b><span>{o.paymentMethod} · {o.paymentStatus}</span></div>{o.estimatedDelivery && <p className="deliveryTime"><Clock size={15}/> Estimated delivery: {o.estimatedDelivery}</p>}{o.adminNote && <p className="muted">Admin note: {o.adminNote}</p>}{o.status==="Pending" && <p className="hint"><Clock size={14}/> Waiting for kitchen approval. Your order is not confirmed yet.</p>}</article>;
}
