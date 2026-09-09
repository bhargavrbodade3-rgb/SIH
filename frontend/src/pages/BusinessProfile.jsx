import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import {
  Building2,
  Save,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  User,
  IndianRupee,
  Layers,
  Zap,
  Droplets,
  Utensils,
  Cpu,
  Truck,
  FileText,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Home
} from 'lucide-react';
import api from '../api/client';

export default function BusinessProfile() {
  const { business, refreshBusiness } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('entity'); // 'entity' | 'premises' | 'parameters' | 'sector'
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    business_type: 'Manufacturing',
    sector: 'Food Processing',
    description: '',
    applicant_name: '',
    phone: '',
    email: '',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    address: '',
    pincode: '',
    investment: 5000000,
    employees: 25,
    business_stage: 'PLANNING',
    land_property: 'Rented Industrial / Commercial Premises',
    premises_type: 'RENTED',
    business_activity: '',
    electricity_load_kw: '25 kW',
    water_usage_lpd: '5000 Litres/Day',
    food_handling: true,
    manufacturing_activity: true,
    construction_activity: false,
    storage_activity: false,
    logistics_activity: false,
    sector_answers: ''
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        business_type: business.business_type || 'Manufacturing',
        sector: business.sector || 'Food Processing',
        description: business.description || '',
        applicant_name: business.applicant_name || '',
        phone: business.phone || '',
        email: business.email || '',
        state: business.state || 'Maharashtra',
        district: business.district || 'Pune',
        city: business.city || 'Pune',
        address: business.address || '',
        pincode: business.pincode || '',
        investment: business.investment || 5000000,
        employees: business.employees || 25,
        business_stage: business.business_stage || 'PLANNING',
        land_property: business.land_property || 'Rented Industrial / Commercial Premises',
        premises_type: (business.premises_type || (business.land_property?.toLowerCase().includes('own') ? 'OWNED' : business.land_property?.toLowerCase().includes('lease') ? 'LEASED' : 'RENTED')),
        business_activity: business.business_activity || '',
        electricity_load_kw: business.electricity_load_kw || '25 kW',
        water_usage_lpd: business.water_usage_lpd || '5000 Litres/Day',
        food_handling: business.food_handling ?? (business.sector?.toLowerCase().includes('food')),
        manufacturing_activity: business.manufacturing_activity ?? (business.business_type === 'Manufacturing'),
        construction_activity: business.construction_activity || false,
        storage_activity: business.storage_activity || false,
        logistics_activity: business.logistics_activity || false,
        sector_answers: business.sector_answers || ''
      });
    }
  }, [business]);

  // When sector changes, smartly adapt default activities
  const handleSectorChange = (newSector) => {
    const isFood = newSector === 'Food Processing' || newSector === 'Hospitality';
    const isMfg = newSector === 'Manufacturing' || newSector === 'Food Processing' || newSector === 'Construction';
    const isIT = newSector === 'IT / Software' || newSector === 'Professional Services';
    const isLogistics = newSector === 'Logistics & Warehousing';

    setFormData((prev) => ({
      ...prev,
      sector: newSector,
      business_type: isMfg ? 'Manufacturing' : isIT ? 'Services' : 'Trading',
      food_handling: isFood,
      manufacturing_activity: isMfg,
      logistics_activity: isLogistics,
      business_activity: isFood
        ? 'Processing of agro-commodities, fruit pulp, and packaged foods'
        : isIT
        ? 'Software product development, cloud SaaS, and IT consulting'
        : isMfg
        ? 'Precision engineering, fabrication, and industrial assembly'
        : 'Commercial retail sales and customer distribution'
    }));
  };

  const handlePremisesChange = (newPremises) => {
    let landPropLabel = 'Rented Industrial / Commercial Premises';
    if (newPremises === 'OWNED') landPropLabel = 'Freehold / Self-Owned Land & Premises';
    if (newPremises === 'LEASED') landPropLabel = 'Leased Industrial Plot (MIDC 99-Yr Lease)';
    if (newPremises === 'CONSENT_SHARED') landPropLabel = 'Consent / Shared Commercial Facility';

    setFormData((prev) => ({
      ...prev,
      premises_type: newPremises,
      land_property: landPropLabel
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedMsg(false);
    try {
      if (business?.id) {
        await api.put(`/business/${business.id}`, formData);
      } else {
        await api.post('/business', formData);
      }
      await refreshBusiness();
      setSavedMsg(true);
      toast.success('Business profile updated! Compliance roadmap recalculated.');
      setTimeout(() => setSavedMsg(false), 4000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  const sectorsList = [
    { value: 'Food Processing', label: 'Food Processing & Agro Industries' },
    { value: 'IT / Software', label: 'IT / Software & Technology Services' },
    { value: 'Manufacturing', label: 'Manufacturing & Industrial Engineering' },
    { value: 'Retail & Trade', label: 'Retail, Wholesale & Commercial Trade' },
    { value: 'Professional Services', label: 'Professional Consulting & Financial Services' },
    { value: 'Construction', label: 'Construction, Infrastructure & Real Estate' },
    { value: 'Logistics & Warehousing', label: 'Logistics, Supply Chain & Warehousing' },
    { value: 'Hospitality', label: 'Hospitality, Hotels & Restaurants' },
    { value: 'Healthcare', label: 'Healthcare, Clinical & Diagnostic Centers' },
    { value: 'Automobile Workshop', label: 'Automobile Workshop & Service Station' }
  ];

  const stages = [
    { value: 'IDEA', label: 'Idea Validation' },
    { value: 'PLANNING', label: 'Project Planning' },
    { value: 'REGISTRATION', label: 'Statutory Registration' },
    { value: 'SETUP', label: 'Civil Construction & Plant Setup' },
    { value: 'OPERATIONAL', label: 'Commercial Operations' },
    { value: 'EXPANSION', label: 'Capacity Expansion' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Business Profile & Regulatory Parameters"
        subtitle="Your entity classification, premises tenure, and operational scale dynamically configure the statutory roadmap and required document checklists."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Business Profile' }]}
        action={
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Recalculating...' : 'Save & Recalculate Roadmap'}</span>
          </button>
        }
      />

      {/* Profile Completion & Sector Summary Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{formData.name || 'Your Enterprise'}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                {formData.sector}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Premises: <strong className="text-slate-700">{formData.premises_type}</strong> | State: <strong className="text-slate-700">{formData.state} ({formData.district})</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-4">
          <div className="text-right">
            <span className="text-2xl font-extrabold text-indigo-600">
              {business?.profile_completion || 92}%
            </span>
            <p className="text-[11px] text-slate-400">Profile Readiness</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Refresh & Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Progressive Disclosure) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'entity', label: '1. Entity Identity', icon: ShieldCheck },
          { id: 'premises', label: '2. Location & Premises', icon: Home },
          { id: 'parameters', label: '3. Scale & Utilities', icon: IndianRupee },
          { id: 'sector', label: '4. Sector Questions', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: Entity Identity */}
        {activeTab === 'entity' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Primary Enterprise Identity & Industry Sector
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 1 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Enterprise Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Organic Foods Pvt Ltd"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry Sector * (Determines Regulatory Roadmaps)
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => handleSectorChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                >
                  {sectorsList.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Constitution / Structure
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Private Limited Company">Private Limited Company (MCA / SPICe+)</option>
                  <option value="Limited Liability Partnership">Limited Liability Partnership (LLP)</option>
                  <option value="Registered Partnership Firm">Registered Partnership Firm (RoF)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="One Person Company">One Person Company (OPC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant / Authorized Signatory Name
                </label>
                <input
                  type="text"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma (Managing Director)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Mobile (Aadhaar Linked)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Registered Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="compliance@enterprise.com"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Business Activity / Products Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="State-of-the-art organic agro-processing unit specializing in aseptic fruit pulp, ready-to-cook dehydrated vegetable mixtures, and packaged healthy snacks."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Location & Premises (Premises-Based Document Logic) */}
        {activeTab === 'premises' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Premises Tenure & Physical Location (Triggers Conditional Document Checklists)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 2 of 4</span>
            </div>

            {/* Premises Type Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Nature of Premises Tenure * (Crucial: Changes Document Requirements in Vault)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    type: 'RENTED',
                    title: 'Rented Premises',
                    desc: 'Requires Registered Rent Deed, Electricity Bill & Landlord NOC',
                    badge: 'Rent Agreement'
                  },
                  {
                    type: 'OWNED',
                    title: 'Self-Owned Property',
                    desc: 'Requires Registered Sale Deed / Index-II & Municipal Tax Paid Bill',
                    badge: 'Title Deed'
                  },
                  {
                    type: 'LEASED',
                    title: 'Long-Term Leased',
                    desc: 'Requires 99-Yr Industrial Lease Deed (e.g. MIDC) & Possession Letter',
                    badge: 'Lease Deed'
                  },
                  {
                    type: 'CONSENT_SHARED',
                    title: 'Consent / Shared',
                    desc: 'Requires Owner Consent Declaration & Consenter Ownership Proof',
                    badge: 'Owner NOC'
                  },
                ].map((item) => {
                  const isSelected = formData.premises_type === item.type;
                  return (
                    <div
                      key={item.type}
                      onClick={() => handlePremisesChange(item.type)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{item.desc}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <span>{isSelected ? 'Active Selection' : 'Select'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State Jurisdiction</label>
                <input
                  type="text"
                  readOnly
                  value={formData.state}
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Pune, Nagpur, Mumbai"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Industrial Cluster</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Chakan Industrial Area"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address / Plot Coordinates
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot No. E-42, Chakan Industrial Area, Phase-II, MIDC"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="410501"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scale & Utilities */}
        {activeTab === 'parameters' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Capital Investment, Workforce & Utility Requirements
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 3 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Investment in Plant & Machinery (₹)
                </label>
                <input
                  type="number"
                  required
                  value={formData.investment}
                  onChange={(e) => setFormData({ ...formData, investment: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">₹50 Lakhs qualifies for MSME Small Enterprise</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workforce (Total Employees)
                </label>
                <input
                  type="number"
                  required
                  value={formData.employees}
                  onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 1 })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">≥ 10 employees mandates Factories Act plan scrutiny</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Lifecycle Stage</label>
                <select
                  value={formData.business_stage}
                  onChange={(e) => setFormData({ ...formData, business_stage: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {stages.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connected Electricity Requirement (kW / HP)
                </label>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={formData.electricity_load_kw}
                    onChange={(e) => setFormData({ ...formData, electricity_load_kw: e.target.value })}
                    placeholder="e.g. 50 kW"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industrial Water Requirement (Litres/Day)
                </label>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                  <input
                    type="text"
                    value={formData.water_usage_lpd}
                    onChange={(e) => setFormData({ ...formData, water_usage_lpd: e.target.value })}
                    placeholder="e.g. 10,000 Litres/Day"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Progressive Disclosure (Sector Questions) */}
        {activeTab === 'sector' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Sector-Specific Progressive Disclosure: {formData.sector}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 4 of 4</span>
            </div>

            <p className="text-xs text-slate-500">
              These domain-specific questions adapt automatically to your industry to avoid displaying irrelevant queries.
            </p>

            {/* Food Sector Specific */}
            {(formData.sector === 'Food Processing' || formData.sector === 'Hospitality') && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Food Safety & Hygiene Criteria (FSSAI)</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.food_handling}
                      onChange={(e) => setFormData({ ...formData, food_handling: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>Enterprise directly manufactures, processes, or packages edible food items (Mandates FSSAI License).</span>
                  </label>
                </div>
              </div>
            )}

            {/* Manufacturing Specific */}
            {(formData.sector === 'Manufacturing' || formData.sector === 'Food Processing' || formData.sector === 'Construction') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Industrial Plant Machinery & Environmental Activity (MPCB & DISH)</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.manufacturing_activity}
                      onChange={(e) => setFormData({ ...formData, manufacturing_activity: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>Physical transformation of raw materials using power-driven machinery (Mandates DISH Plan Approval).</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.storage_activity}
                      onChange={(e) => setFormData({ ...formData, storage_activity: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>Premises stores chemical drums, LPG, or flammable materials (Mandates Fire Safety NOC).</span>
                  </label>
                </div>
              </div>
            )}

            {/* Logistics & Commercial */}
            {(formData.sector === 'Logistics & Warehousing' || formData.sector === 'Retail & Trade') && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Commercial Transportation & Warehouse Fleet</span>
                </div>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.logistics_activity}
                    onChange={(e) => setFormData({ ...formData, logistics_activity: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>Enterprise operates heavy commercial vehicles or transit storage hubs.</span>
                </label>
              </div>
            )}

            {/* IT / Software Specific */}
            {(formData.sector === 'IT / Software' || formData.sector === 'Professional Services') && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span>IT Infrastructure & Export Parameters</span>
                </div>
                <p className="text-xs text-purple-800">
                  IT and software services are classified as non-polluting commercial offices. Industrial pollution clearances (MPCB CTE/CTO) and Factory Act plan scrutiny are automatically bypassed from your compliance roadmap.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form Bottom Save Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {savedMsg && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile saved & roadmap updated!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'entity' && (
              <button
                type="button"
                onClick={() => {
                  const tabs = ['entity', 'premises', 'parameters', 'sector'];
                  const prevIdx = tabs.indexOf(activeTab) - 1;
                  if (prevIdx >= 0) setActiveTab(tabs[prevIdx]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                ← Previous Step
              </button>
            )}

            {activeTab !== 'sector' ? (
              <button
                type="button"
                onClick={() => {
                  const tabs = ['entity', 'premises', 'parameters', 'sector'];
                  const nextIdx = tabs.indexOf(activeTab) + 1;
                  if (nextIdx < tabs.length) setActiveTab(tabs[nextIdx]);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Recalculating...' : 'Save & Recalculate Roadmap'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
