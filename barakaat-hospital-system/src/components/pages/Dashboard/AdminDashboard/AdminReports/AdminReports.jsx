import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../../../../contexts/AuthContext';
import { 
  LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import styles from './AdminReports.module.css';

const AdminReports = () => {
  const { currentUser, userRole } = useAuth();
  const [reportType, setReportType] = useState('appointments');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Fetch report data when parameters change
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/dashboard/admin/reports', {
          params: { reportType, startDate, endDate }
        });
        setReportData(response.data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to fetch report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is admin
    if (userRole === 'admin') {
      fetchReportData();
    }
  }, [reportType, startDate, endDate, userRole]);

  // Format appointment data for charts
  const formatAppointmentData = () => {
    if (!reportData?.appointments) return [];

    // Group by date and create status counts
    const dateMap = {};
    
    reportData.appointments.forEach(item => {
      const date = item._id.date;
      const status = item._id.status;
      const count = item.count;
      
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      
      dateMap[date][status] = count;
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Format doctor performance data
  const formatDoctorData = () => {
    if (!reportData?.doctors) return [];
    return reportData.doctors.slice(0, 10); // Limit to top 10 doctors
  };

  // Format patient registration data
  const formatPatientRegistrations = () => {
    if (!reportData?.patientRegistrations) return [];
    
    return reportData.patientRegistrations.map(item => ({
      date: item._id,
      registrations: item.count
    }));
  };

  // Format prescription data
  const formatPrescriptionData = () => {
    if (!reportData?.prescriptionsReport) return [];
    
    const dateMap = {};
    
    reportData.prescriptionsReport.forEach(item => {
      const date = item._id.date;
      const status = item._id.status;
      const count = item.count;
      
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      
      dateMap[date][status] = count;
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Format medication data
  const formatMedicationData = () => {
    if (!reportData?.medicationsReport) return [];
    return reportData.medicationsReport;
  };

  // Format prescription by specialization data
  const formatPrescriptionBySpecialization = () => {
    if (!reportData?.prescriptionsBySpecialization) return [];
    return reportData.prescriptionsBySpecialization;
  };

  // Format user registration data
  const formatUserRegistrationData = () => {
    if (!reportData?.userRegistrations) return [];
    
    const dateMap = {};
    
    reportData.userRegistrations.forEach(item => {
      const date = item._id.date;
      const role = item._id.role;
      const count = item.count;
      
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      
      dateMap[date][role] = count;
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Format user activity data
  const formatUserActivityData = () => {
    if (!reportData?.userActivity) return [];
    
    const dateMap = {};
    
    reportData.userActivity.forEach(item => {
      const date = item._id.date;
      const role = item._id.role;
      const count = item.count;
      
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      
      dateMap[date][role] = count;
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Format user status breakdown
  const formatUserStatusData = () => {
    if (!reportData?.userStatusBreakdown) return [];
    
    const roleStatusMap = reportData.userStatusBreakdown.reduce((acc, item) => {
      const role = item._id.role;
      const isActive = item._id.isActive;
      const count = item.count;
      
      if (!acc[role]) {
        acc[role] = { 
          role,
          active: 0,
          inactive: 0
        };
      }
      
      if (isActive) {
        acc[role].active = count;
      } else {
        acc[role].inactive = count;
      }
      
      return acc;
    }, {});
    
    return Object.values(roleStatusMap);
  };

  // Calculate appointment duration averages
  const calculateAppointmentDurationAverages = () => {
    if (!reportData?.appointmentDurations) return [];
    return reportData.appointmentDurations;
  };

  // Format patient demographics
  const formatPatientDemographics = () => {
    if (!reportData?.patientDemographics) return [];
    
    return reportData.patientDemographics.map(item => ({
      name: item._id.ageGroup,
      value: item.count
    }));
  };

  // Check if user is admin
  if (userRole !== 'admin') {
    return (
      <div className={styles.accessDeniedContainer}>
        <div className={styles.accessDeniedCard}>
          <h1 className={styles.accessDeniedTitle}>Access Denied</h1>
          <p>You do not have permission to view this page. This area is restricted to admin users only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.pageTitle}>Admin Reports Dashboard</h1>
        
        {/* Report Controls */}
        <div className={styles.controlPanel}>
          <div className={styles.controlGrid}>
            <div>
              <label className={styles.controlLabel}>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className={styles.selectControl}
              >
                <option value="users">User Reports</option>
                <option value="appointments">Appointment Reports</option>
                <option value="doctors">Doctor Performance</option>
                <option value="patients">Patient Analytics</option>
                <option value="prescriptions">Prescription Reports</option>
              </select>
            </div>
            
            <div>
              <label className={styles.controlLabel}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateControl}
              />
            </div>
            
            <div>
              <label className={styles.controlLabel}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateControl}
              />
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
          </div>
        )}

        {/* Report Content - Users */}
        {!loading && !error && reportType === 'users' && reportData?.userRegistrations && (
          <div className={styles.reportsGrid}>
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>User Registrations Over Time</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatUserRegistrationData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="admin" stroke="#0088FE" name="Admin" />
                    <Line type="monotone" dataKey="doctor" stroke="#00C49F" name="Doctor" />
                    <Line type="monotone" dataKey="patient" stroke="#FFBB28" name="Patient" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>User Activity</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatUserActivityData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="admin" stroke="#0088FE" name="Admin" />
                    <Line type="monotone" dataKey="doctor" stroke="#00C49F" name="Doctor" />
                    <Line type="monotone" dataKey="patient" stroke="#FFBB28" name="Patient" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>User Status Breakdown</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatUserStatusData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#00C49F" name="Active Users" />
                    <Bar dataKey="inactive" fill="#FF8042" name="Inactive Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Content - Appointments */}
        {!loading && !error && reportType === 'appointments' && reportData?.appointments && (
          <div className={styles.reportsGrid}>
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Appointment Status Over Time</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatAppointmentData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="scheduled" stroke="#0088FE" name="Scheduled" />
                    <Line type="monotone" dataKey="completed" stroke="#00C49F" name="Completed" />
                    <Line type="monotone" dataKey="cancelled" stroke="#FF8042" name="Cancelled" />
                    <Line type="monotone" dataKey="no-show" stroke="#FF0000" name="No Show" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Appointment Duration Metrics</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={calculateAppointmentDurationAverages()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)} mins`, 'Duration']} />
                    <Legend />
                    <Line type="monotone" dataKey="avgDuration" stroke="#0088FE" name="Average Duration (min)" />
                    <Line type="monotone" dataKey="minDuration" stroke="#00C49F" name="Min Duration (min)" />
                    <Line type="monotone" dataKey="maxDuration" stroke="#FF8042" name="Max Duration (min)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Appointment Summary</h2>
              <div className={styles.summarySection}>
                <div className={styles.statsGrid}>
                  {['scheduled', 'completed', 'cancelled', 'no-show'].map((status, index) => {
                    // Calculate total for each status
                    const total = formatAppointmentData().reduce((sum, item) => sum + (item[status] || 0), 0);
                    
                    return (
                      <div key={status} className={styles.statCard}>
                        <h4 className={styles.statLabel}>{status}</h4>
                        <p className={styles.statValue} style={{ color: COLORS[index % COLORS.length] }}>{total}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Content - Doctors */}
        {!loading && !error && reportType === 'doctors' && reportData?.doctors && (
          <div className={styles.reportsGrid}>
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Doctor Performance Metrics</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatDoctorData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#00C49F" name="Completed" />
                    <Bar dataKey="cancelled" fill="#FF8042" name="Cancelled" />
                    <Bar dataKey="noShow" fill="#FF0000" name="No Show" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Doctor Verification Status</h2>
              <div className={styles.chartContainer}>
                {reportData.doctorVerifications && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportData.doctorVerifications.map(item => ({
                        date: item._id.date,
                        verified: item._id.isVerified ? item.count : 0,
                        unverified: !item._id.isVerified ? item.count : 0
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="verified" stroke="#00C49F" name="Verified" />
                      <Line type="monotone" dataKey="unverified" stroke="#FF8042" name="Unverified" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h3 className={styles.sectionTitle}>Doctor Completion Rates</h3>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Specialization</th>
                      <th>Total Appointments</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatDoctorData().map((doctor, index) => (
                      <tr key={index}>
                        <td className={styles.tableName}>{doctor.name}</td>
                        <td>{doctor.specialization}</td>
                        <td>{doctor.totalAppointments}</td>
                        <td>
                          <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{ width: `${doctor.completionRate}%` }}
                              ></div>
                            </div>
                            <span className={styles.progressText}>{doctor.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Content - Patients */}
        {!loading && !error && reportType === 'patients' && reportData?.patientRegistrations && (
          <div className={styles.reportsGrid}>
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Patient Registrations Over Time</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatPatientRegistrations()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="registrations" stroke="#8884d8" name="New Registrations" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Top Patient Appointment Frequency</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.patientAppointmentFrequency || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointmentCount" fill="#82ca9d" name="Appointment Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {reportData.patientDemographics && reportData.patientDemographics.length > 0 && (
              <div className={styles.reportCard}>
                <h2 className={styles.reportTitle}>Patient Demographics</h2>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatPatientDemographics()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {formatPatientDemographics().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Report Content - Prescriptions */}
        {!loading && !error && reportType === 'prescriptions' && reportData?.prescriptionsReport && (
          <div className={styles.reportsGrid}>
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Prescriptions Over Time</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatPrescriptionData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" stroke="#0088FE" name="Active" />
                    <Line type="monotone" dataKey="completed" stroke="#00C49F" name="Completed" />
                    <Line type="monotone" dataKey="expired" stroke="#FF8042" name="Expired" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Most Prescribed Medications</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatMedicationData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="_id"
                      label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatMedicationData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className={styles.reportCard}>
              <h2 className={styles.reportTitle}>Prescriptions by Specialization</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatPrescriptionBySpecialization()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Prescription Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className={styles.tableSectionTop}>
                <h3 className={styles.sectionTitle}>Top Medications</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Medication Name</th>
                        <th>Prescription Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formatMedicationData().map((med, index) => (
                        <tr key={index}>
                          <td className={styles.tableName}>{med._id}</td>
                          <td>{med.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;