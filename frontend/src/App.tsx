import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Camera, Check, ChevronDown, CircleHelp, MessageCircle, MonitorSmartphone, Play, RefreshCw, Smartphone, Users, X } from "lucide-react";
import { API_BASE_URL, api, getApiData, getErrorMessage, postApiData } from "./lib/api";

type Device = { id: string; model?: string; androidVersion?: string; status: string; currentActivity?: string };
type Field = { name: string; label: string; type: "text" | "textarea"; required: boolean; placeholder?: string };
type Service = { id: string; name: string; description: string; fields: Field[] };
type Job = { id: string; serviceId: string; deviceId: string; status: string; progress: number; error?: string | null };

const icons = {
  facebook: Users,
  whatsapp: MessageCircle,
  instagram: Camera,
  telegram: MessageCircle,
};

export default function App() {
  const queryClient = useQueryClient();
  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => getApiData<Device[]>("/devices"),
    refetchInterval: 5000,
  });
  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => getApiData<Service[]>("/services"),
  });
  const devices = devicesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const [serviceId, setServiceId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: () => getApiData<Job[]>("/automation"),
  });
  const jobs = jobsQuery.data ?? [];
  const startJobMutation = useMutation({
    mutationFn: (input: { serviceId: string; deviceId: string; data: Record<string, unknown> }) =>
      postApiData<Job>("/automation/start", input),
    onSuccess: (job) => {
      queryClient.setQueryData<Job[]>(["jobs"], (current) => [job, ...(current ?? []).filter((item) => item.id !== job.id)].slice(0, 20));
      queryClient.setQueryData(["job", job.id], job);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
  const createSessionMutation = useMutation({
    mutationFn: (id: string) => postApiData<{ sessionId: string }>(`/devices/${encodeURIComponent(id)}/session`),
    onSuccess: ({ sessionId }) => setNotice(`Appium session ready: ${sessionId}`),
    onError: (error) => setNotice(getErrorMessage(error, "Could not create Appium session.")),
  });

  const selectedService = services.find((service) => service.id === serviceId);
  const jobQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ["job", job.id],
      queryFn: () => getApiData<Job>(`/automation/${job.id}`),
      initialData: job,
      retry: false,
      refetchOnWindowFocus: false,
      refetchInterval: (query: { state: { data?: Job } }) =>
        query.state.data?.status === "RUNNING" || query.state.data?.status === "PENDING" ? 5000 : false,
    })),
  });
  const displayedJobs = jobs.map((job, index) => jobQueries[index]?.data ?? job);
  const terminalJobIds = displayedJobs
    .filter((job) => job.status === "COMPLETED" || job.status === "FAILED" || job.status === "STOPPED")
    .map((job) => job.id)
    .join(",");

  useEffect(() => {
    setDeviceId((current) => current && devices.some((device) => device.id === current && device.status === "AVAILABLE")
      ? current
      : devices.find((device) => device.status === "AVAILABLE")?.id || "");
  }, [devices]);

  useEffect(() => {
    if (devicesQuery.error) setNotice(getErrorMessage(devicesQuery.error, "Could not reach the backend."));
    else if (servicesQuery.error) setNotice(getErrorMessage(servicesQuery.error, "Could not load services."));
    else if (jobsQuery.error) setNotice(getErrorMessage(jobsQuery.error, "Could not load job history."));
  }, [devicesQuery.error, servicesQuery.error, jobsQuery.error]);

  useEffect(() => {
    if (terminalJobIds) void queryClient.invalidateQueries({ queryKey: ["devices"] });
  }, [terminalJobIds, queryClient]);

  async function startAutomation(event: FormEvent) {
    event.preventDefault();
    if (!selectedService || !deviceId) return;
    setNotice("");
    try {
      const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, key === "phoneNumbers" ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : value]));
      const job = await startJobMutation.mutateAsync({ serviceId, deviceId, data });
      setNotice(`Job ${job.id} started.`);
      setValues({});
    } catch (error) {
      setNotice(getErrorMessage(error, "Could not start the job."));
    }
  }

  function refreshDevices() {
    return devicesQuery.refetch();
  }

  function createSession(id: string) {
    createSessionMutation.mutate(id);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><MonitorSmartphone size={19} /></span><span>device<span className="brand-light">flow</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active"><Activity size={17} /> Overview</button>
        <button className="nav-item" onClick={() => document.getElementById("devices")?.scrollIntoView({ behavior: "smooth" })}><Smartphone size={17} /> Devices <span className="nav-count">{devices.length}</span></button>
        <button className="nav-item" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}><Play size={17} /> Automations</button>
        <div className="sidebar-bottom"><CircleHelp size={16} /><span>Local development</span><span className="online-dot" /></div>
      </aside>

      <section className="main-content">
        <header className="topbar"><span>Workspace <span className="crumb">/</span> Overview</span><div className="topbar-right"><span className="api-indicator"><i /> Local API</span><span className="avatar">DF</span></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow">AUTOMATION WORKSPACE</div><h1>Good morning <span className="wave">✳</span></h1><p>Manage your Android devices and run service automations.</p></div><button className="button button-secondary" onClick={() => void refreshDevices()}><RefreshCw size={15} /> Refresh</button></div>

          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Connected devices</span><Smartphone size={17} /></div><div className="stat-value">{devices.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="status-dot" /> {devices.filter((device) => device.status === "AVAILABLE").length} available now</div></div>
            <div className="stat-card"><div className="stat-top"><span>Running jobs</span><Activity size={17} /></div><div className="stat-value">{displayedJobs.filter((job) => job.status === "RUNNING").length.toString().padStart(2, "0")}</div><div className="stat-foot">Across connected devices</div></div>
            <div className="stat-card"><div className="stat-top"><span>Services</span><Play size={17} /></div><div className="stat-value">{services.length.toString().padStart(2, "0")}</div><div className="stat-foot">Ready to configure</div></div>
          </div>

          <section className="section" id="devices">
            <div className="section-heading"><div><h2>Devices</h2><p>USB connected Android phones detected by ADB</p></div><span className="count-pill">{devices.length} devices</span></div>
            {devices.length === 0 ? <div className="empty-card"><div className="empty-icon"><Smartphone size={22} /></div><strong>No devices found</strong><span>Connect a phone with USB debugging enabled, then refresh.</span><code>adb devices</code></div> : <div className="device-grid">
              {devices.map((device) => <article className="device-card" key={device.id}>
                <div className="device-card-top"><div className="device-icon"><Smartphone size={20} /></div><span className={`device-status ${device.status.toLowerCase()}`}><i />{device.status.toLowerCase()}</span></div>
                <h3>{device.model || "Android device"}</h3><div className="device-id">{device.id}</div>
                <div className="device-meta"><span>Android {device.androidVersion || "—"}</span><span>{device.currentActivity || "Ready for automation"}</span></div>
                <div className="device-actions"><button className="button button-primary small" onClick={() => createSession(device.id)} disabled={createSessionMutation.isPending}>{createSessionMutation.isPending ? "Connecting…" : "Connect Appium"}</button><button className="icon-button" title="View screenshot" aria-label={`View screenshot for ${device.model || device.id}`} onClick={() => window.open(`${API_BASE_URL}/devices/${encodeURIComponent(device.id)}/screenshot`, "_blank", "noopener,noreferrer")}><Camera size={16} /></button></div>
              </article>)}
            </div>}
          </section>

          <section className="section" id="services">
            <div className="section-heading"><div><h2>Start an automation</h2><p>Choose a service, device, and provide its required data.</p></div></div>
            <div className="automation-layout">
              <div className="service-list"><div className="mini-label">AVAILABLE SERVICES</div>{services.map((service) => {
                const Icon = icons[service.id as keyof typeof icons] || Play;
                return <button key={service.id} onClick={() => { setServiceId(service.id); setValues({}); }} className={`service-option ${serviceId === service.id ? "selected" : ""}`}><span className={`service-icon ${service.id}`}><Icon size={18} /></span><span className="service-label"><strong>{service.name}</strong><small>{service.description}</small></span>{serviceId === service.id && <Check size={17} className="selected-check" />}</button>;
              })}</div>
              <form className="automation-form" onSubmit={startAutomation}>
                {!selectedService ? <div className="form-empty"><div className="empty-icon"><Play size={20} /></div><strong>Select a service to begin</strong><span>Its input fields will appear here.</span></div> : <>
                  <div className="form-title"><div><div className="eyebrow">CONFIGURE SERVICE</div><h3>{selectedService.name} automation</h3></div><span className="draft-pill">Draft</span></div>
                  <label className="field-label" htmlFor="device-select">Target device <span>*</span></label>
                  <div className="select-wrap"><select id="device-select" required value={deviceId} onChange={(event) => setDeviceId(event.target.value)}><option value="">Select a device</option>{devices.filter((device) => device.status === "AVAILABLE").map((device) => <option key={device.id} value={device.id}>{device.model || "Android device"} · {device.id}</option>)}</select><ChevronDown size={16} /></div>
                  {selectedService.fields.map((field) => <div className="field-group" key={field.name}><label className="field-label" htmlFor={field.name}>{field.label}{field.required && <span> *</span>}</label>{field.type === "textarea" ? <textarea id={field.name} rows={field.name === "phoneNumbers" ? 4 : 3} required={field.required} placeholder={field.name === "phoneNumbers" ? "+1 555 010 0001\n+1 555 010 0002" : "Type a message"} value={values[field.name] || ""} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} /> : <input id={field.name} required={field.required} value={values[field.name] || ""} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />}</div>)}
                  <div className="form-footer"><span>Runs on your local device</span><button className="button button-dark" type="submit" disabled={startJobMutation.isPending || !deviceId}><Play size={14} fill="currentColor" />{startJobMutation.isPending ? "Starting…" : "Start automation"}</button></div>
                </>}
              </form>
            </div>
          </section>

          <section className="section jobs-section">
            <div className="section-heading"><div><h2>Recent jobs</h2><p>Latest jobs saved in PostgreSQL</p></div><span className="count-pill">{jobs.length} recent</span></div>
            {displayedJobs.length === 0 ? <div className="jobs-empty">No jobs yet. Start an automation to see it here.</div> : <div className="jobs-table"><div className="jobs-header"><span>JOB</span><span>SERVICE</span><span>DEVICE</span><span>STATUS</span><span>PROGRESS</span></div>{displayedJobs.map((job) => <div className="job-row" key={job.id}><span className="job-id">{job.id.slice(0, 17)}…</span><span>{services.find((service) => service.id === job.serviceId)?.name || job.serviceId}</span><span>{job.deviceId}</span><span className={`job-status ${job.status.toLowerCase()}`}>{job.status.toLowerCase()}</span><span className="progress-wrap"><span className="progress-track"><i style={{ width: `${job.progress}%` }} /></span>{job.progress}%</span>{job.error && <small className="job-error">{job.error}</small>}</div>)}</div>}
          </section>
          <footer>DeviceFlow <span>·</span> Local Android automation</footer>
        </div>
      </section>
    </main>
  );
}
