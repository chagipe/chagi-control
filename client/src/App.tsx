import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('offline');
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'Media' });
  const [ticketActivo, setTicketActivo] = useState<any>(null);
  const [tecnico, setTecnico] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [isHelpDesk, setIsHelpDesk] = useState(false); 

  // Referencia para el sonido
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const API = "http://localhost:3001/tickets";
  const CODIGO_SECRETO = "chagi2026"; 

  const getCol = (p: string) => {
    if (p === 'Alta') return '#ff0055';
    if (p === 'Media') return '#ffcc00';
    return '#00ff88';
  };

  const sync = async () => {
    try {
      const res = await axios.get(API);
      
      // --- LÓGICA DE ALERTA DE EMERGENCIA ---
      const actualesAltos = tickets.filter((t:any) => t.prioridad === 'Alta' && t.estado !== 'Resuelto').length;
      const nuevosAltos = res.data.filter((t:any) => t.prioridad === 'Alta' && t.estado !== 'Resuelto').length;
      
      // Si hay más tickets de alta prioridad que antes, disparamos la alerta
      if (nuevosAltos > actualesAltos) {
        audioRef.current?.play().catch(() => console.log("Esperando interacción del usuario para sonar"));
        document.title = "⚠️ ¡NUEVA URGENCIA!";
        setTimeout(() => document.title = "ChagiControl", 4000);
      }
      // ---------------------------------------

      setTickets(res.data);
      setStatus('online');
    } catch (e) { setStatus('offline'); }
  };

  // El intervalo de sincronización
  useEffect(() => {
    sync();
    const timer = setInterval(sync, 5000);
    return () => clearInterval(timer);
  }, [tickets]); // Escucha cambios en los tickets para comparar

  const vaciarBaseDeDatos = async () => {
    if (window.confirm("⚠️ ¿VACIAR TODA LA TABLA?")) {
      try {
        await axios.delete(API);
        sync();
      } catch (e) { alert("Error al limpiar"); }
    }
  };

  const crearTicket = async () => {
    if (!form.titulo.trim()) return alert("Asunto vacío");
    await axios.post(API, form);
    setForm({ titulo: '', descripcion: '', prioridad: 'Media' });
    sync();
  };

  const finalizarTicket = async (id: number) => {
    if (!tecnico.trim()) return alert("Nombre del técnico");
    await axios.put(`${API}/${id}`, { tecnico_asignado: tecnico });
    setTicketActivo(null);
    setTecnico('');
    sync();
  };

  const pendientes = tickets.filter((t:any) => t.estado !== 'Resuelto');
  const urgentesCount = pendientes.filter((t:any) => t.prioridad === 'Alta').length;
  const resueltosTotal = tickets.filter((t:any) => t.estado === 'Resuelto').length;

  const ticketsFiltrados = pendientes.filter(t => 
    t.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: '40px', minHeight: '100vh', background: '#020202', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Elemento de Audio Oculto */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      {/* HEADER DE ACCESO */}
      <div style={{ position: 'fixed', top: 25, right: 35, textAlign: 'right', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', justifyContent: 'flex-end' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'online' ? '#00ff88' : '#f05' }}></div>
          <span style={{ fontSize: '10px', color: '#444' }}>{status.toUpperCase()}</span>
        </div>
        {!isHelpDesk ? (
          <input type="password" placeholder="Admin..." onChange={(e) => e.target.value === CODIGO_SECRETO && setIsHelpDesk(true)} style={{ background: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '5px', borderRadius: '4px' }} />
        ) : (
          <button onClick={vaciarBaseDeDatos} style={{ background: '#ff0055', color: '#fff', border: 'none', padding: '5px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VACIAR TODO</button>
        )}
      </div>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '50px', fontWeight: '900', margin: 0 }}>Chagi<span style={{ color: '#0070f3' }}>Control.</span></h1>
        <p style={{ color: '#333', fontSize: '10px', letterSpacing: '4px' }}>DASHBOARD DE SOPORTE</p>
      </header>

      {/* CUADROS SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', borderBottom: '3px solid #0070f3', textAlign: 'center' }}>
          <h4 style={{ fontSize: '10px', color: '#555', margin: '0 0 10px 0' }}>PENDIENTES</h4>
          <span style={{ fontSize: '40px', fontWeight: '900' }}>{pendientes.length}</span>
        </div>
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', borderBottom: '3px solid #ff0055', textAlign: 'center' }}>
          <h4 style={{ fontSize: '10px', color: '#555', margin: '0 0 10px 0' }}>URGENTES</h4>
          <span style={{ fontSize: '40px', fontWeight: '900', color: '#ff0055' }}>{urgentesCount}</span>
        </div>
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', borderBottom: '3px solid #00ff88', textAlign: 'center' }}>
          <h4 style={{ fontSize: '10px', color: '#555', margin: '0 0 10px 0' }}>RESUELTOS</h4>
          <span style={{ fontSize: '40px', fontWeight: '900', color: '#00ff88' }}>{resueltosTotal}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        
        {/* FORMULARIO */}
        <section style={{ background: '#0a0a0a', padding: '30px', borderRadius: '25px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '12px', marginBottom: '25px', color: '#444', letterSpacing: '1px' }}>NUEVA ENTRADA</h3>
          <input style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #222', color: '#fff', padding: '10px 0', marginBottom: '25px', outline: 'none', boxSizing: 'border-box' }} placeholder="Asunto..." value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
          <textarea style={{ width: '100%', background: '#111', border: 'none', borderRadius: '12px', color: '#888', padding: '15px', minHeight: '120px', outline: 'none', boxSizing: 'border-box', resize: 'none', marginBottom: '20px' }} placeholder="Descripción..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            {['Baja', 'Media', 'Alta'].map(p => (
              <button key={p} onClick={() => setForm({...form, prioridad: p})} style={{ flex: 1, background: 'none', border: 'none', color: form.prioridad === p ? getCol(p) : '#333', fontWeight: 'bold', cursor: 'pointer', borderBottom: form.prioridad === p ? `2px solid ${getCol(p)}` : '2px solid transparent', paddingBottom: '5px' }}>{p}</button>
            ))}
          </div>

          <button onClick={crearTicket} style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>GENERAR TICKET</button>
        </section>

        {/* LISTADO */}
        <section>
          <input style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' }} placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {ticketsFiltrados.map((t: any) => (
              <div key={t.id} onClick={() => setTicketActivo(t)} style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', borderLeft: `5px solid ${getCol(t.prioridad)}`, cursor: 'pointer' }}>
                <small style={{ color: '#444', fontWeight: 'bold' }}>#{t.id} • {t.prioridad.toUpperCase()}</small>
                <h3 style={{ margin: '10px 0 0 0', fontSize: '18px' }}>{t.titulo}</h3>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL DETALLE */}
      {ticketActivo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0a0a0a', padding: '40px', borderRadius: '25px', width: '480px', border: `1px solid ${getCol(ticketActivo.prioridad)}`, boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '30px', marginBottom: '15px' }}>{ticketActivo.titulo}</h2>
            <p style={{ color: '#777', lineHeight: '1.6', marginBottom: '30px' }}>{ticketActivo.descripcion || "Sin descripción."}</p>
            {isHelpDesk ? (
              <div style={{ marginTop: '20px' }}>
                <input style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', color: '#0f8', marginBottom: '15px', boxSizing: 'border-box' }} placeholder="Técnico..." value={tecnico} onChange={e => setTecnico(e.target.value)} />
                <button onClick={() => finalizarTicket(ticketActivo.id)} style={{ width: '100%', background: getCol(ticketActivo.prioridad), color: '#000', padding: '18px', fontWeight: '900', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>MARCAR COMO RESUELTO</button>
              </div>
            ) : <p style={{ color: '#f05', textAlign: 'center', fontWeight: 'bold' }}>🔒 MODO LECTURA</p>}
            <button onClick={() => setTicketActivo(null)} style={{ width: '100%', background: 'none', border: 'none', color: '#444', marginTop: '20px', cursor: 'pointer' }}>Regresar</button>
          </div>
        </div>
      )}
    </div>
  );
}