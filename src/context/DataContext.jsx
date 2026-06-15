import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [psychotestPackages, setPsychotestPackages] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      let jobsUrl = `${API_URL}/jobs`;
      let applicantsUrl = `${API_URL}/applicants`;
      
      if (user && user.role === 'HRD') {
        jobsUrl += `?hr_id=${user.id}`;
        applicantsUrl += `?hr_id=${user.id}`;
      }

      const [jobsRes, applicantsRes, packagesRes] = await Promise.all([
        fetch(jobsUrl),
        fetch(applicantsUrl),
        fetch(`${API_URL}/packages`)
      ]);
      
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (applicantsRes.ok) setApplicants(await applicantsRes.json());
      if (packagesRes.ok) setPsychotestPackages(await packagesRes.json());
    } catch (error) {
      console.error("Failed to fetch data from backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const addPsychotestPackage = async (pkgName) => {
    try {
      const res = await fetch(`${API_URL}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pkgName })
      });
      if (res.ok) {
        setPsychotestPackages(prev => [...prev, pkgName]);
      } else {
        alert("Gagal menyimpan paket psikotes. Pastikan tabel database sudah ada.");
      }
    } catch (error) {
      console.error(error);
      alert("Koneksi ke backend gagal. Pastikan XAMPP dan Backend berjalan.");
    }
  };

  const updateApplicantStatus = async (applicantId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/applicants/${applicantId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setApplicants((prev) => prev.map((app) => (app.id === applicantId ? { ...app, status: newStatus } : app)));
      } else {
        alert("Gagal mengupdate status. Pastikan tabel database sudah ada.");
      }
    } catch (error) {
      console.error(error);
      alert("Koneksi ke backend gagal. Pastikan XAMPP dan Backend berjalan.");
    }
  };

  const addInterviewFeedback = async (applicantId, feedback) => {
    try {
      const res = await fetch(`${API_URL}/applicants/${applicantId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: feedback.score,
          notes: feedback.notes,
          conclusion: feedback.conclusion
        })
      });
      if (res.ok) {
        setApplicants((prev) =>
          prev.map((app) => (app.id === applicantId ? { ...app, interviewSummary: feedback } : app))
        );
        return true;
      } else {
        alert("Gagal menyimpan hasil penilaian wawancara.");
      }
    } catch (error) {
      console.error(error);
      alert("Koneksi ke backend gagal.");
    }
    return false;
  };

  const addJob = async (jobData) => {
    try {
      const payload = { ...jobData };
      if (user && user.role === 'HRD') {
        payload.hr_id = user.id;
      }
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedJob = await res.json();
        setJobs(prev => [{ ...savedJob, status: 'Active' }, ...prev]);
        return { success: true };
      } else {
        return { success: false, error: 'Gagal memposting lowongan.' };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Koneksi ke backend gagal.' };
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const statusToSave = newStatus === 'Dibuka' ? 'Active' : newStatus;
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusToSave })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: statusToSave } : j));
      } else {
        alert("Gagal mengupdate status lowongan.");
      }
    } catch (error) {
      console.error(error);
      alert("Koneksi ke backend gagal. Pastikan XAMPP dan Backend berjalan.");
    }
  };

  const updateJob = async (jobId, updatedJob) => {
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJob)
      });
      if (res.ok) {
        const savedJob = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...savedJob } : j));
        return { success: true };
      } else {
        return { success: false, error: 'Gagal memperbarui lowongan.' };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Koneksi ke backend gagal.' };
    }
  };

  const deleteJob = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Remove from jobs list
        setJobs(prev => prev.filter(j => j.id !== jobId));
        // Remove related applicants from applicants list (due to cascade on backend)
        setApplicants(prev => prev.filter(a => a.jobId !== jobId));
        return { success: true };
      } else {
        return { success: false, error: 'Gagal menghapus lowongan.' };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Koneksi ke backend gagal.' };
    }
  };

  const addSupportMessage = async (text, role, targetHrId = null) => {
    const timestamp = new Date().toISOString();
    const hrId = targetHrId || user?.id; // If HR, it's their own ID. If Operator, it's the target HR's ID.
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderRole: role, text, timestamp, hr_id: hrId })
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setSupportMessages(prev => [...prev, savedMsg]);
      } else {
        alert("Gagal mengirim pesan.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile/company`);
      if (res.ok) return await res.json();
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const updateCompanyProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/profile/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const uploadCompanyLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${API_URL}/profile/company/logo`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.logo;
      }
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const uploadCompanyNibFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('nib_file', file);
      const res = await fetch(`${API_URL}/profile/company/nib-file`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.nibFile;
      }
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile/user`);
      if (res.ok) return await res.json();
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const updateUserProfile = async (userProfileData) => {
    try {
      const res = await fetch(`${API_URL}/profile/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfileData)
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <DataContext.Provider value={{ 
      jobs, applicants, updateApplicantStatus, addInterviewFeedback, addJob,
      isChatOpen, setIsChatOpen, psychotestPackages, addPsychotestPackage,
      supportMessages, addSupportMessage, updateJobStatus, updateJob, deleteJob,
      fetchCompanyProfile, updateCompanyProfile, uploadCompanyLogo, uploadCompanyNibFile,
      fetchUserProfile, updateUserProfile, fetchData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
