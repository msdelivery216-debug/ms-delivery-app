import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, User, Mail, Image as ImageIcon, Save, CheckCircle2, Upload } from 'lucide-react';
import { Profile } from '../types';

export default function ProfileSection() {
  const [profile, setProfile] = useState<Profile>({
    companyName: '',
    ownerName: '',
    contactEmail: '',
    logoUrl: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data && data.companyName !== undefined) {
          setProfile(data);
        }
      })
      .catch(err => console.error("Starting with fresh profile:", err))
      .finally(() => setLoading(false)); // This guarantees the loading stops!
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        // This will pop up an alert if Vercel or MongoDB rejects the save!
        const errData = await res.json().catch(() => ({}));
        alert(`Could not save: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      alert("Network error: Could not reach the server to save.");
      console.error("Failed to save profile:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Business Profile</h1>
        <p className="text-neutral-500">Customize your company details and branding.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center space-y-6">
            <div className="relative group mx-auto w-32 h-32">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="w-full h-full rounded-3xl object-cover border-4 border-neutral-50" />
              ) : (
                <div className="w-full h-full bg-neutral-50 rounded-3xl flex items-center justify-center text-neutral-300 border-2 border-dashed border-neutral-200">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-3xl cursor-pointer transition-all backdrop-blur-[2px]">
                <Upload className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900">Company Logo</h3>
              <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input required type="text" value={profile.companyName} onChange={(e) => setProfile({...profile, companyName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. MS Delivery Services" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Owner Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input required type="text" value={profile.ownerName} onChange={(e) => setProfile({...profile, ownerName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Full name" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input required type="email" value={profile.contactEmail} onChange={(e) => setProfile({...profile, contactEmail: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="admin@msdelivery.com" />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-neutral-900 text-white font-bold text-lg rounded-3xl hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-3">
              <Save className="w-6 h-6" />
              Save Changes
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Profile Updated!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
