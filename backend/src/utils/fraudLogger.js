import FraudLog from '../models/FraudLog.js';
import { getClientIP } from './ip.js';

/**
 * Create a fraud log entry
 * @param {Object} options - Fraud log options
 * @param {string} options.userId - User ID
 * @param {string} options.electionId - Election ID
 * @param {string} options.type - Type of fraud
 * @param {string} options.severity - Severity level (low, medium, high, critical)
 * @param {string} options.details - Detailed description
 * @param {Object} options.req - Express request object (for IP and user agent)
 * @param {Object} options.metadata - Additional metadata
 */
export const createFraudLog = async (options) => {
  try {
    const {
      userId,
      electionId,
      type,
      severity = 'medium',
      details = '',
      req = null,
      metadata = {}
    } = options;

    const fraudLogData = {
      userId,
      electionId,
      type,
      severity,
      details,
      metadata
    };

    // Add IP and user agent if request object is provided
    if (req) {
      fraudLogData.ipAddress = getClientIP(req);
      fraudLogData.userAgent = req.headers['user-agent'] || '';
    }

    const fraudLog = await FraudLog.create(fraudLogData);
    
    // Emit real-time notification to admin room
    if (req && req.app && req.app.get('io')) {
      const io = req.app.get('io');
      io.to('admin-room').emit('fraud-detected', {
        fraudLogId: fraudLog._id,
        type,
        severity,
        userId,
        electionId,
        timestamp: new Date()
      });
    }

    return fraudLog;
  } catch (error) {
    console.error('Error creating fraud log:', error);
    throw error;
  }
};

/**
 * Get fraud statistics for admin dashboard
 */
export const getFraudStatistics = async () => {
  try {
    const stats = await FraudLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: ['$resolved', 1, 0] } },
          unresolved: { $sum: { $cond: ['$resolved', 0, 1] } },
          byType: {
            $push: {
              type: '$type',
              severity: '$severity',
              resolved: '$resolved'
            }
          },
          bySeverity: {
            $push: {
              severity: '$severity',
              resolved: '$resolved'
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        resolved: 0,
        unresolved: 0,
        byType: {},
        bySeverity: {}
      };
    }

    const result = stats[0];
    
    // Process by type
    const byType = {};
    result.byType.forEach(item => {
      if (!byType[item.type]) {
        byType[item.type] = { total: 0, resolved: 0, unresolved: 0 };
      }
      byType[item.type].total++;
      if (item.resolved) {
        byType[item.type].resolved++;
      } else {
        byType[item.type].unresolved++;
      }
    });

    // Process by severity
    const bySeverity = {};
    result.bySeverity.forEach(item => {
      if (!bySeverity[item.severity]) {
        bySeverity[item.severity] = { total: 0, resolved: 0, unresolved: 0 };
      }
      bySeverity[item.severity].total++;
      if (item.resolved) {
        bySeverity[item.severity].resolved++;
      } else {
        bySeverity[item.severity].unresolved++;
      }
    });

    return {
      total: result.total,
      resolved: result.resolved,
      unresolved: result.unresolved,
      byType,
      bySeverity
    };
  } catch (error) {
    console.error('Error getting fraud statistics:', error);
    throw error;
  }
};

/**
 * Check for suspicious patterns
 */
export const detectSuspiciousPatterns = async (userId, electionId, req) => {
  try {
    const recentLogs = await FraudLog.find({
      userId,
      electionId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    // Check for multiple fraud attempts
    if (recentLogs.length >= 3) {
      await createFraudLog({
        userId,
        electionId,
        type: 'SystemManipulation',
        severity: 'high',
        details: `Multiple fraud attempts detected: ${recentLogs.length} attempts in 24 hours`,
        req,
        metadata: { attemptCount: recentLogs.length, timeWindow: '24h' }
      });
    }

    // Check for same IP with different users
    if (req) {
      const ipAddress = getClientIP(req);
      const sameIPLogs = await FraudLog.find({
        ipAddress,
        electionId,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }).distinct('userId');

      if (sameIPLogs.length > 1) {
        await createFraudLog({
          userId,
          electionId,
          type: 'SuspiciousIP',
          severity: 'high',
          details: `Multiple users from same IP: ${sameIPLogs.length} different users`,
          req,
          metadata: { 
            ipAddress, 
            userCount: sameIPLogs.length, 
            otherUsers: sameIPLogs.filter(id => id.toString() !== userId.toString())
          }
        });
      }
    }
  } catch (error) {
    console.error('Error detecting suspicious patterns:', error);
  }
};
