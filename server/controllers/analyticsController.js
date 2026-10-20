const Note = require("../models/Note");
const Subject = require("../models/Subject");
const DownloadEvent = require("../models/DownloadEvent");

const getAnalyticsData = async (req) => {
  const user = req.user;

  if (!user || !["admin", "master"].includes(user.role)) {
    const error = new Error("Admin or Master access required");
    error.statusCode = 403;
    throw error;
  }

  if (
    user.role === "admin" &&
    user.permissions?.viewStatistics !== true
  ) {
    const error = new Error(
      "You do not have permission to view statistics"
    );
    error.statusCode = 403;
    throw error;
  }

  const { from, to } = req.query;

  const parseDate = (value, endOfDay = false) => {
    if (!value) return null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const error = new Error("Dates must use YYYY-MM-DD format");
      error.statusCode = 400;
      throw error;
    }

    const date = new Date(
      `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    );

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      const error = new Error(`Invalid date: ${value}`);
      error.statusCode = 400;
      throw error;
    }

    return date;
  };

  const fromDate = parseDate(from);
  const toDate = parseDate(to, true);

  if (fromDate && toDate && fromDate > toDate) {
    const error = new Error("'from' must be before or equal to 'to'");
    error.statusCode = 400;
    throw error;
  }

  const dateFilter = {};
  if (fromDate) dateFilter.$gte = fromDate;
  if (toDate) dateFilter.$lte = toDate;

  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const subjectIds =
    user.role === "admin" ? user.assignedSubjects || [] : null;

  const noteScope = subjectIds
    ? { subject: { $in: subjectIds } }
    : {};

  const eventScope = subjectIds
    ? { subject: { $in: subjectIds } }
    : {};

  if (hasDateFilter) {
    noteScope.createdAt = dateFilter;
    eventScope.downloadedAt = dateFilter;
  }

  const [
    totalNotes,
    pendingNotes,
    approvedNotes,
    rejectedNotes,
    outdatedNotes,
    downloadEvents,
    mostDownloadedNotes,
    subjectRankings,
  ] = await Promise.all([
    Note.countDocuments(noteScope),
    Note.countDocuments({ ...noteScope, status: "PENDING" }),
    Note.countDocuments({ ...noteScope, status: "APPROVED" }),
    Note.countDocuments({ ...noteScope, status: "REJECTED" }),
    Note.countDocuments({ ...noteScope, status: "OUTDATED" }),

    DownloadEvent.countDocuments(eventScope),

    hasDateFilter
      ? DownloadEvent.aggregate([
          { $match: eventScope },
          {
            $group: {
              _id: "$note",
              downloads: { $sum: 1 },
            },
          },
          { $sort: { downloads: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: Note.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "note",
            },
          },
          { $unwind: "$note" },
          {
            $lookup: {
              from: Subject.collection.name,
              localField: "note.subject",
              foreignField: "_id",
              as: "subject",
            },
          },
          {
            $unwind: {
              path: "$subject",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              title: "$note.title",
              fileName: "$note.fileName",
              subjectName: "$subject.name",
              downloads: 1,
            },
          },
        ])
      : Note.aggregate([
          { $match: { ...noteScope, status: "APPROVED", isCurrent: true } },
          { $sort: { downloadCount: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: Subject.collection.name,
              localField: "subject",
              foreignField: "_id",
              as: "subject",
            },
          },
          {
            $unwind: {
              path: "$subject",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              fileName: 1,
              subjectName: "$subject.name",
              downloads: { $ifNull: ["$downloadCount", 0] },
            },
          },
        ]),

    hasDateFilter
      ? DownloadEvent.aggregate([
          { $match: eventScope },
          {
            $group: {
              _id: "$subject",
              downloads: { $sum: 1 },
            },
          },
          { $sort: { downloads: -1 } },
          {
            $lookup: {
              from: Subject.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "subject",
            },
          },
          { $unwind: "$subject" },
          {
            $project: {
              _id: 1,
              name: "$subject.name",
              code: "$subject.code",
              downloads: 1,
            },
          },
        ])
      : Note.aggregate([
          { $match: { ...noteScope, status: "APPROVED", isCurrent: true } },
          {
            $group: {
              _id: "$subject",
              downloads: { $sum: { $ifNull: ["$downloadCount", 0] } },
            },
          },
          { $sort: { downloads: -1 } },
          {
            $lookup: {
              from: Subject.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "subject",
            },
          },
          { $unwind: "$subject" },
          {
            $project: {
              _id: 1,
              name: "$subject.name",
              code: "$subject.code",
              downloads: 1,
            },
          },
        ]),
  ]);

  // Without a date filter, use the existing lifetime note counters.
  // With a date filter, count actual download events in that period.
  const totalDownloads = hasDateFilter
    ? downloadEvents
    : await Note.aggregate([
        {
          $match: {
            ...noteScope,
            status: "APPROVED",
            isCurrent: true,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$downloadCount", 0] } },
          },
        },
      ]).then((result) => result[0]?.total || 0);

  return {
    filters: {
      from: from || null,
      to: to || null,
    },
    summary: {
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      outdatedNotes,
      totalDownloads,
    },
    mostDownloadedNotes,
    subjectRankings,
  };
};

const getAnalytics = async (req, res) => {
  try {
    const analytics = await getAnalyticsData(req);
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch analytics",
    });
  }
};

const escapeCsv = (value) => {
  let text = String(value ?? "");

  // Prevent spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const exportAnalyticsCsv = async (req, res) => {
  try {
    const data = await getAnalyticsData(req);
    const rows = [
      ["Section", "Name", "Subject", "Downloads or Count"],
      ["Summary", "Total Notes", "", data.summary.totalNotes],
      ["Summary", "Pending Notes", "", data.summary.pendingNotes],
      ["Summary", "Approved Notes", "", data.summary.approvedNotes],
      ["Summary", "Rejected Notes", "", data.summary.rejectedNotes],
      ["Summary", "Outdated Notes", "", data.summary.outdatedNotes],
      ["Summary", "Total Downloads", "", data.summary.totalDownloads],
    ];

    for (const note of data.mostDownloadedNotes) {
      rows.push([
        "Most Downloaded Notes",
        note.title || note.fileName || note._id,
        note.subjectName || "",
        note.downloads,
      ]);
    }

    for (const subject of data.subjectRankings) {
      rows.push([
        "Subject Rankings",
        subject.name || "",
        subject.code || "",
        subject.downloads,
      ]);
    }

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    const dateLabel = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="campusnotes-analytics-${dateLabel}.csv"`
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export analytics error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to export analytics",
    });
  }
};

module.exports = {
  getAnalytics,
  exportAnalyticsCsv,
};
