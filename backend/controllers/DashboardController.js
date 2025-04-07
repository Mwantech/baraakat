// controllers/dashboardController.js
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctors');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

/**
 * Get dashboard statistics for patients
 * @route GET /api/dashboard/patient
 * @access Private (Patient only)
 */
exports.getPatientDashboardStats = async (req, res) => {
  try {
    const patientId = req.userId;
    
    // Find patient record to ensure it exists
    const patientRecord = await Patient.findOne({ user: patientId });
    if (!patientRecord) {
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    // Get current date for filtering appointments
    const currentDate = new Date();
    
    // Get total upcoming appointments for this patient
    const upcomingAppointments = await Appointment.countDocuments({
      patient: patientRecord._id,
      appointmentDate: { $gte: currentDate },
      status: 'scheduled'
    });
    
    // Get total completed appointments for this patient
    const completedAppointments = await Appointment.countDocuments({
      patient: patientRecord._id,
      status: 'completed'
    });
    
    // Get total active prescriptions for this patient
    const activePrescriptions = await Prescription.countDocuments({
      patient: patientRecord._id,
      status: 'active'
    });
    
    // Get total medical records (completed appointments with diagnosis)
    const medicalRecords = await Appointment.countDocuments({
      patient: patientRecord._id,
      status: 'completed',
      diagnosis: { $exists: true, $ne: [] }
    });
    
    // Get next appointment details
    const nextAppointment = await Appointment.findOne({
      patient: patientRecord._id,
      appointmentDate: { $gte: currentDate },
      status: 'scheduled'
    })
    .sort({ appointmentDate: 1, startTime: 1 })
    .populate('doctor', 'specialization department')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    });
    
    // Get prescription that's about to expire
    const expiringPrescription = await Prescription.findOne({
      patient: patientRecord._id,
      status: 'active',
      endDate: { $gte: currentDate, $lte: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) } // Next 7 days
    })
    .sort({ endDate: 1 })
    .populate('doctor', 'specialization')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    });
    
    return res.json({
      stats: {
        upcomingAppointments,
        completedAppointments,
        activePrescriptions,
        medicalRecords
      },
      nextAppointment: nextAppointment || null,
      expiringPrescription: expiringPrescription || null
    });
    
  } catch (error) {
    console.error('Error fetching patient dashboard stats:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get dashboard statistics for doctors
 * @route GET /api/dashboard/doctor
 * @access Private (Doctor only)
 */
exports.getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorId = req.userId;
    
    // Get current date for filtering appointments
    const currentDate = new Date();
    
    // Find doctor record
    const doctorRecord = await Doctor.findOne({ user: doctorId });
    if (!doctorRecord) {
      return res.status(404).json({ message: 'Doctor record not found' });
    }
    
    // Get total patients (unique patients who have had appointments with this doctor)
    const totalPatients = await Appointment.distinct('patient', { doctor: doctorRecord._id });
    
    // Get upcoming appointments for today
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await Appointment.countDocuments({
      doctor: doctorRecord._id,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'scheduled'
    });
    
    // Get total upcoming appointments (including today)
    const upcomingAppointments = await Appointment.countDocuments({
      doctor: doctorRecord._id,
      appointmentDate: { $gte: currentDate },
      status: 'scheduled'
    });
    
    // Get total completed appointments
    const completedAppointments = await Appointment.countDocuments({
      doctor: doctorRecord._id,
      status: 'completed'
    });
    
    // Get active prescriptions written by this doctor
    const activePrescriptions = await Prescription.countDocuments({
      doctor: doctorRecord._id,
      status: 'active'
    });
    
    // Get next 5 appointments
    const nextAppointments = await Appointment.find({
      doctor: doctorRecord._id,
      appointmentDate: { $gte: currentDate },
      status: 'scheduled'
    })
    .sort({ appointmentDate: 1, startTime: 1 })
    .limit(5)
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .select('appointmentDate startTime endTime symptoms');
    
    return res.json({
      stats: {
        totalPatients: totalPatients.length,
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        activePrescriptions
      },
      nextAppointments: nextAppointments || []
    });
    
  } catch (error) {
    console.error('Error fetching doctor dashboard stats:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get dashboard statistics for admin
 * @route GET /api/dashboard/admin
 * @access Private (Admin only)
 */
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Get current date for filtering 
    const currentDate = new Date();
    
    // Get total counts for each user type
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalPrescriptions = await Prescription.countDocuments();
    
    // Get counts for filtered data
    const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });
    const pendingDoctors = await Doctor.countDocuments({ isVerified: false });
    
    const upcomingAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: currentDate },
      status: 'scheduled'
    });
    
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    
    const activePrescriptions = await Prescription.countDocuments({ status: 'active' });
    
    // User registration over time (last 6 months)
    const sixMonthsAgo = new Date(currentDate);
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format user registration data
    const monthlyUserRegistrations = userRegistrations.reduce((acc, item) => {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthYear = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthNames[item._id.month - 1],
          year: item._id.year,
          patients: 0,
          doctors: 0,
          admins: 0,
          total: 0
        };
      }
      
      acc[monthYear][item._id.role + 's'] = item.count;
      acc[monthYear].total += item.count;
      
      return acc;
    }, {});
    
    // Convert to array for easier frontend consumption
    const userGrowthByMonth = Object.values(monthlyUserRegistrations);
    
    // Monthly appointments report (last 6 months)
    const monthlyAppointments = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$appointmentDate" },
            month: { $month: "$appointmentDate" }
          },
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format monthly report data
    const monthlyReport = monthlyAppointments.map(item => {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return {
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        total: item.count,
        completed: item.completed,
        cancelled: item.cancelled
      };
    });
    
    // User activity stats
    const userActivityStats = await User.aggregate([
      {
        $match: {
          lastLogin: { $exists: true }
        }
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          recentLogins: {
            $sum: {
              $cond: [
                { $gte: ["$lastLogin", new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Format user activity data
    const userActivity = userActivityStats.reduce((acc, item) => {
      acc[item._id] = {
        total: item.count,
        recentLogins: item.recentLogins,
        activePercentage: Math.round((item.recentLogins / item.count) * 100)
      };
      return acc;
    }, {});
    
    // Appointment distribution by department
    const departmentDistribution = await Appointment.aggregate([
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      {
        $unwind: "$doctorInfo"
      },
      {
        $group: {
          _id: "$doctorInfo.department",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get latest pending doctor registrations
    const pendingDoctorsList = await Doctor.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email')
      .select('specialization licenseNumber createdAt');
    
    // Get latest registered users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email role createdAt');
    
    return res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        totalPatients,
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalPrescriptions,
        activePrescriptions
      },
      reports: {
        userGrowth: userGrowthByMonth,
        userActivity,
        monthlyAppointments: monthlyReport,
        departmentDistribution
      },
      pendingDoctors: pendingDoctorsList,
      recentUsers
    });
    
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get admin reports data
 * @route GET /api/dashboard/admin/reports
 * @access Private (Admin only)
 */
exports.getAdminReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    let end = endDate ? new Date(endDate) : new Date();
    
    // Ensure end date is set to end of day
    end.setHours(23, 59, 59, 999);
    
    switch(reportType) {
      case 'users': {
        // User registrations over time
        const userRegistrations = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                role: "$role"
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id.date": 1 }
          }
        ]);
        
        // User activity metrics
        const userActivity = await User.aggregate([
          {
            $match: {
              lastLogin: { $exists: true, $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } },
                role: "$role"
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id.date": 1 }
          }
        ]);
        
        // Active vs inactive users
        const userStatusBreakdown = await User.aggregate([
          {
            $match: {
              createdAt: { $lte: end }
            }
          },
          {
            $group: {
              _id: {
                role: "$role",
                isActive: "$isActive"
              },
              count: { $sum: 1 }
            }
          }
        ]);
        
        return res.json({
          userRegistrations,
          userActivity,
          userStatusBreakdown
        });
      }
      
      case 'appointments': {
        const appointmentReport = await Appointment.aggregate([
          {
            $match: {
              appointmentDate: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                status: "$status",
                date: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id.date": 1 }
          }
        ]);
        
        // Add appointment duration metrics
        const appointmentDurations = await Appointment.aggregate([
          {
            $match: {
              appointmentDate: { $gte: start, $lte: end },
              startTime: { $exists: true },
              endTime: { $exists: true }
            }
          },
          {
            $project: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
              // Calculate duration in minutes
              duration: {
                $divide: [
                  { $subtract: ["$endTime", "$startTime"] },
                  60000 // Convert milliseconds to minutes
                ]
              }
            }
          },
          {
            $group: {
              _id: "$date",
              avgDuration: { $avg: "$duration" },
              minDuration: { $min: "$duration" },
              maxDuration: { $max: "$duration" }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ]);
        
        return res.json({ 
          appointments: appointmentReport,
          appointmentDurations
        });
      }
      
      case 'doctors': {
        // Doctor performance report
        const doctorReport = await Appointment.aggregate([
          {
            $match: {
              appointmentDate: { $gte: start, $lte: end }
            }
          },
          {
            $lookup: {
              from: "doctors",
              localField: "doctor",
              foreignField: "_id",
              as: "doctorInfo"
            }
          },
          {
            $unwind: "$doctorInfo"
          },
          {
            $lookup: {
              from: "users",
              localField: "doctorInfo.user",
              foreignField: "_id",
              as: "userInfo"
            }
          },
          {
            $unwind: "$userInfo"
          },
          {
            $group: {
              _id: {
                doctorId: "$doctor",
                name: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] },
                specialization: "$doctorInfo.specialization"
              },
              totalAppointments: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
              },
              cancelled: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
              },
              noShow: {
                $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] }
              }
            }
          },
          {
            $project: {
              _id: 0,
              doctorId: "$_id.doctorId",
              name: "$_id.name",
              specialization: "$_id.specialization",
              totalAppointments: 1,
              completed: 1,
              cancelled: 1,
              noShow: 1,
              completionRate: {
                $round: [
                  { $multiply: [{ $divide: ["$completed", "$totalAppointments"] }, 100] },
                  1
                ]
              }
            }
          },
          {
            $sort: { totalAppointments: -1 }
          }
        ]);
        
        // Doctor verification status over time
        const doctorVerifications = await Doctor.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                isVerified: "$isVerified"
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id.date": 1 }
          }
        ]);
        
        return res.json({ 
          doctors: doctorReport,
          doctorVerifications
        });
      }
      
      case 'patients': {
        // Patient registration over time
        const patientRegistrations = await Patient.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ]);
        
        // Patient appointment frequency
        const patientAppointmentFrequency = await Appointment.aggregate([
          {
            $match: {
              appointmentDate: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: "$patient",
              appointmentCount: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: "patients",
              localField: "_id",
              foreignField: "_id",
              as: "patientInfo"
            }
          },
          {
            $unwind: "$patientInfo"
          },
          {
            $lookup: {
              from: "users",
              localField: "patientInfo.user",
              foreignField: "_id",
              as: "userInfo"
            }
          },
          {
            $unwind: "$userInfo"
          },
          {
            $project: {
              _id: 0,
              patientId: "$_id",
              name: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] },
              appointmentCount: 1
            }
          },
          {
            $sort: { appointmentCount: -1 }
          },
          {
            $limit: 10
          }
        ]);
        
        // Patient demographics if available
        let patientDemographics = [];
        if (await Patient.findOne({ "demographics.age": { $exists: true } })) {
          patientDemographics = await Patient.aggregate([
            {
              $match: {
                "demographics.age": { $exists: true }
              }
            },
            {
              $group: {
                _id: {
                  ageGroup: {
                    $switch: {
                      branches: [
                        { case: { $lte: ["$demographics.age", 18] }, then: "0-18" },
                        { case: { $lte: ["$demographics.age", 30] }, then: "19-30" },
                        { case: { $lte: ["$demographics.age", 45] }, then: "31-45" },
                        { case: { $lte: ["$demographics.age", 60] }, then: "46-60" },
                      ],
                      default: "60+"
                    }
                  }
                },
                count: { $sum: 1 }
              }
            },
            {
              $sort: { "_id.ageGroup": 1 }
            }
          ]);
        }
        
        return res.json({
          patientRegistrations,
          patientAppointmentFrequency,
          patientDemographics
        });
      }
      
      case 'prescriptions': {
        // Prescriptions overview
        const prescriptionsReport = await Prescription.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                status: "$status"
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id.date": 1 }
          }
        ]);
        
        // Most prescribed medications
        const medicationsReport = await Prescription.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $unwind: "$medications"
          },
          {
            $group: {
              _id: "$medications.name",
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          },
          {
            $limit: 10
          }
        ]);
        
        // Prescriptions by doctor specialization
        const prescriptionsBySpecialization = await Prescription.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $lookup: {
              from: "doctors",
              localField: "doctor",
              foreignField: "_id",
              as: "doctorInfo"
            }
          },
          {
            $unwind: "$doctorInfo"
          },
          {
            $group: {
              _id: "$doctorInfo.specialization",
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          }
        ]);
        
        return res.json({
          prescriptionsReport,
          medicationsReport,
          prescriptionsBySpecialization
        });
      }
      
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
  } catch (error) {
    console.error('Error generating admin reports:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;