# Enhanced Kanban Board User Guide

## Overview

The Enhanced Kanban Board system provides powerful tools for managing your job search workflow with custom columns, WIP limits, analytics, and export capabilities. This guide will help you master all the new features.

## 🚀 Getting Started

### Accessing the Enhanced Board

1. Navigate to your dashboard
2. Click on the board selector at the top left
3. Choose "Create New Board" or select an existing board
4. The enhanced kanban board will load with your custom configuration

### Default Setup

When you first use the enhanced system, you'll see:

- **Default columns**: Wishlist, Applied, Phone Screen, Assessment, Take Home, Interviewing, Final Round, Offered, Accepted, Rejected, Withdrawn, Ghosted
- **WIP limits**: Applied (5), Interviewing (3), Final Round (2)
- **Analytics dashboard**: Track your conversion rates and pipeline health

## 🎨 Customizing Your Board

### Creating Custom Columns

1. Click the "Add Column" button in the board header
2. Fill in the column details:
   - **Name**: Descriptive name (e.g., "Technical Assessment")
   - **Color**: Choose from preset colors for visual distinction
   - **WIP Limit**: Set a work-in-progress limit (0 = no limit)
3. Click "Create Column"

**Pro Tips:**

- Use clear, action-oriented names
- Choose colors that match your workflow stages
- Set WIP limits based on your capacity

### Managing Columns

Click the three-dot menu (⋮) on any column to:

**Edit Column:**

- Change name, color, or WIP limit
- Updates apply instantly to existing applications

**Delete Column:**

- Only available for custom columns (not default ones)
- Applications in deleted columns are preserved and can be moved later
- Consider archiving instead of deleting

**Reorder Columns:**

- Open the column manager
- Drag columns to reorder them
- Save the new order
- Applications automatically move to the correct positions

### Board Settings

Click the "Settings" button (⚙️) to configure:

**Basic Information:**

- Board name and description
- Board visibility (default/archived)

**Appearance:**

- **Theme**: Choose between Default, Dark Mode, Colorful, or Minimal
- **Compact Mode**: Reduce spacing for more content
- **Animations**: Enable/disable smooth transitions

**Display Options:**

- **Show Empty Columns**: Display or hide columns with no applications
- **Show Column Counts**: Display application count badges
- **Auto-Archive**: Automatically archive rejected applications after X days

## 📊 Understanding WIP Limits

### What are WIP Limits?

WIP (Work in Progress) limits help you manage your workflow by limiting how many applications can be in a particular stage at once.

### Visual Indicators

- **Green**: Under limit - Good to proceed
- **Yellow**: Near limit (90%+) - Consider waiting or completing current applications
- **Red**: Over limit - Cannot add more applications until some move forward

### Setting Effective WIP Limits

| Column Type  | Recommended WIP | Reason                       |
| ------------ | --------------- | ---------------------------- |
| Wishlist     | 10-20           | Research and discovery phase |
| Applied      | 15-25           | Initial applications         |
| Phone Screen | 5-8             | Time-intensive screening     |
| Assessment   | 3-5             | Takes significant time       |
| Interviewing | 3-5             | Active interview process     |
| Final Round  | 2-3             | Critical final stage         |
| Offers       | 2-5             | Decision-making phase        |

## 📈 Analytics Dashboard

Click the "Analytics" button (📊) to access comprehensive insights:

### Key Metrics

- **Total Applications**: All applications in your board
- **Active Pipeline**: Applications currently in progress
- **Offers**: Total offers received (including accepted)
- **Conversion Rate**: Percentage of applications resulting in offers

### Pipeline Health

- **Application Status Distribution**: Breakdown by current status
- **Success Rate**: Overall application success metrics
- **Average Time in Pipeline**: Days from application to current status

### Column Performance

- **Application Count**: Number of applications per column
- **WIP Utilization**: How close you are to WIP limits
- **Recent Applications**: Latest applications in each column

### Time Range Filtering

- **Last 7 days**: Recent activity
- **Last 30 days**: Monthly overview
- **Last 90 days**: Quarterly analysis

## 📤 Export Functionality

### Export Options

**JSON Export:**

- Complete board data structure
- Includes all applications, columns, and settings
- Perfect for backup or data migration

**CSV Export:**

- Tabular format for spreadsheet applications
- Includes all application details
- Easy to analyze in Excel or Google Sheets

### How to Export

1. Click "Export JSON" or "Export CSV" in the board header
2. The file will download automatically

- JSON files: `board-data-YYYY-MM-DD.json`
- CSV files: `board-data-YYYY-MM-DD.csv`

### Export Uses

- **Backup**: Keep copies of your job search data
- **Analysis**: Import into spreadsheets for deeper analysis
- **Sharing**: Share your progress with mentors or career coaches
- **Portfolio**: Document your job search success

## 🎯 Advanced Features

### Drag and Drop

- **Move Applications**: Drag application cards between columns
- **Visual Feedback**: See where applications will be placed
- **Bulk Operations**: Use column reordering for workflow optimization

### Keyboard Navigation

- **Tab**: Navigate through interactive elements
- **Enter**: Select focused elements
- **Arrow Keys**: Navigate within lists and tables
- **Escape**: Close dialogs and modals

### Mobile Support

- **Responsive Design**: Works seamlessly on tablets and phones
- **Touch Gestures**: Swipe and tap support for mobile devices
- **Optimized Layout**: Columns stack vertically on small screens

## 🔧 Troubleshooting

### Common Issues

**Applications Not Appearing:**

- Check if columns are hidden (Settings → Show Empty Columns)
- Verify applications match column status mapping
- Refresh the page to sync data

**WIP Limits Not Working:**

- Ensure WIP limits are set (0 means no limit)
- Check that applications are properly categorized
- Verify board settings are saved

**Analytics Not Updating:**

- Analytics update daily or when applications change
- Check date range filters in analytics
- Ensure you're looking at the correct board

**Export Failing:**

- Check your internet connection
- Try a smaller date range if you have many applications
- Contact support if issues persist

### Performance Tips

- **Large Boards**: Use filters to focus on specific time periods
- **Mobile Devices**: Close unused browser tabs
- **Slow Networks**: Export data for offline analysis

## 📱 Best Practices

### Board Organization

1. **Clear Naming**: Use descriptive column names that match your workflow
2. **Logical Flow**: Arrange columns in your actual application process order
3. **Regular Cleanup**: Archive or remove old applications monthly
4. **Consistent Updates**: Update application status regularly for accurate analytics

### WIP Management

1. **Set Realistic Limits**: Base limits on your available time and energy
2. **Review Regularly**: Adjust limits based on your capacity and experience
3. **Focus on Quality**: Fewer, better applications are preferable to many mediocre ones
4. **Balance Stages**: Ensure you have capacity at each critical stage

### Analytics Usage

1. **Weekly Reviews**: Check analytics every week to identify trends
2. **Conversion Tracking**: Monitor your success rate and adjust strategy
3. **Time Management**: Use time metrics to identify bottlenecks
4. **Decision Making**: Use data to decide where to focus your efforts

## 🆘 Getting Help

### Resources

- **Video Tutorials**: Watch our getting started videos
- **Blog Articles**: Read tips from successful job seekers
- **Community Forum**: Connect with other users
- **Support Team**: Contact us for technical issues

### Keyboard Shortcuts

| Action              | Shortcut     | Platform |
| ------------------- | ------------ | -------- |
| New Application     | Cmd/Ctrl + N | All      |
| Board Settings      | Cmd/Ctrl + S | All      |
| Analytics Dashboard | Cmd/Ctrl + A | All      |
| Export Data         | Cmd/Ctrl + E | All      |
| Help                | F1           | All      |

### Contact Support

- **Email**: support@jobhunt.app
- **Chat**: In-app chat support
- **Documentation**: [docs.jobhunt.app](https://docs.jobhunt.app)
- **Status Page**: [status.jobhunt.app](https://status.jobhunt.app)

---

## 🎉 Congratulations!

You're now ready to use the Enhanced Kanban Board system effectively. Remember to:

1. **Customize** your board to match your unique workflow
2. **Set realistic WIP limits** to maintain momentum
3. **Review analytics regularly** to optimize your strategy
4. **Export data periodically** for backup and analysis

Happy job hunting! 🚀
