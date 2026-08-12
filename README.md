# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

You are a Senior Product Designer, Senior UX Designer, Senior Software Architect, and Senior Full Stack Engineer.

Your task is to design and build a modern, minimalist Workflow Automation & Task Management Platform.

The goal is NOT to create another Asana, ClickUp, Monday.com, or Jira clone.

The goal is to build an internal Workflow Operating System where administrators design business processes once, and employees simply complete the work assigned to them while the system automatically controls the workflow progression.

The system must be extremely simple, intuitive, modern, and easy enough that any employee can learn it within 15–30 minutes.

The overall UI inspiration should come from:

• Asana (Task Management UI)
• ManyChat (Visual Workflow Builder)

Do NOT copy their design. Use them only as inspiration for user experience and interaction.

The application must prioritize simplicity over feature overload.

==========================================================
CORE PHILOSOPHY
==========================================================

Managers define the workflow once.

Employees only see work assigned to them.

The workflow automatically knows what happens next.

Approvals happen only when required.

Notifications are automatic.

Dashboards update automatically.

Employees never manually assign the next person.

The system removes dependency on memory, manual follow-ups, and constant supervision.

Everything should be workflow-driven.

==========================================================
COMPANY STRUCTURE
==========================================================

Initially the platform supports only two brands.

• Danfe Tea
• Nepal Tea Exchange

Each brand has completely separate:

• Projects
• Tasks
• Dashboards
• Analytics
• Reports

However everything exists inside one application.

One employee may work for:

• Danfe Tea
• Nepal Tea Exchange
• or both brands simultaneously.

When users belong to multiple brands they should be able to switch workspace from the sidebar.

==========================================================
DEPARTMENTS
==========================================================

Initially include ONLY these departments:

• SEO
• Social Media
• Graphic Design
• Videography / Video Editing

Admin can later create unlimited departments.

The system architecture must support future expansion without modification.

==========================================================
ROLES
==========================================================

There are only three roles.

1. Admin

2. Team Lead

3. Team Member

No additional system roles.

==========================================================
ADMIN
==========================================================

The Admin controls the entire platform.

Admin can:

Create brands

Create departments

Create projects

Create workflow templates

Edit workflow templates

Delete workflow templates

Archive workflow templates

Start workflow

Stop workflow

Assign users

Invite users

Deactivate users

Assign Team Leads

Assign permissions

View all projects

View all tasks

View reports

View analytics

Configure system settings

Admin is the ONLY role allowed to access the Workflow Builder.

==========================================================
TEAM LEAD
==========================================================

Team Lead is NOT a manager of the system.

Team Lead behaves exactly like a normal employee.

If assigned a workflow step they receive tasks exactly like everyone else.

Team Lead can:

View assigned tasks

Upload files

Comment

Complete checklist

Submit task for review

Receive notifications

View completed tasks

Additionally Team Leads can view:

Tasks of their own department

Department progress

Department workload

Overdue department tasks

Team Lead CANNOT:

Access Workflow Builder

Create workflows

Delete workflows

Manage users

Manage permissions

Manage departments

==========================================================
TEAM MEMBER
==========================================================

Can only:

View assigned tasks

Upload attachments

Comment

Complete checklist

Submit for review

View completed tasks

Receive notifications

Cannot view other employee tasks.

==========================================================
PERMISSION SYSTEM
==========================================================

Keep permissions extremely simple.

Inspired by Google Drive.

Permission Types

Admin

Editor

Reviewer

Viewer

Admin decides who has which permission.

==========================================================
PROJECTS
==========================================================

Projects are containers.

Examples

Dashain Campaign

Instagram Content

Christmas Campaign

Website SEO

Inside projects Admin starts workflows.

Projects themselves do not contain manually assigned tasks.

Tasks are generated automatically by workflows.

==========================================================
WORKFLOW LIBRARY
==========================================================

Workflow templates are reusable.

Examples

Instagram Story Posting

Facebook Ad

Website Banner

Product Photography

SEO Blog Publishing

Monthly Report

Employee Onboarding

Workflow templates are designed once.

They can be used unlimited times.

==========================================================
WORKFLOW BUILDER
==========================================================

Workflow Builder is inspired by ManyChat.

This is the ONLY drag-and-drop page in the entire application.

Everywhere else there is NO drag and drop.

Workflow Builder contains

Left Sidebar

Departments

Employees

Canvas

Connection Lines

Workflow Nodes

Admin drags employees from sidebar onto canvas.

Each node represents one workflow step.

Each node contains

Step Name

Assigned Employee

Department

Description

Checklist

Attachments

Approval Required

Estimated Time

Deadline

Comments

Connections define workflow order.

Example

Design Story

↓

Review Design

↓

Upload Story

↓

Quality Check

↓

Completed

Workflow templates can be

Saved

Edited

Cloned

Archived

Deleted

==========================================================
WORKFLOW EXECUTION
==========================================================

Admin starts workflow.

Workflow Engine creates Workflow Instance.

Workflow Engine automatically generates first task.

Task Engine assigns employee.

Employee receives notification.

Employee completes task.

Employee submits task.

If approval required

Task goes to Waiting Review.

Reviewer receives notification.

Reviewer

Approve

Reject

Request Changes

If approved

Workflow Engine automatically creates next task.

Assigns next employee.

Sends notification.

Process repeats until workflow finishes.

Nobody manually decides who receives next task.

Workflow controls everything.

==========================================================
TASK STATUS
==========================================================

Ready

↓

In Progress

↓

Waiting Review

↓

Approved

↓

Completed

Alternative flow

Ready

↓

In Progress

↓

Waiting Review

↓

Rejected

↓

Needs Revision

↓

Resubmitted

↓

Approved

↓

Completed

Status movement is automatic.

No drag and drop.

==========================================================
TASK DETAILS
==========================================================

Clicking a task opens a detail page.

Include

Task Name

Description

Workflow

Project

Brand

Department

Assigned Employee

Approver

Due Date

Estimated Time

Priority

Checklist

Reference Files

Attachments

Comments

Activity Timeline

Bottom buttons

Attach Files

Comment

Submit For Review

Only one primary action.

Submit For Review.

==========================================================
WITHDRAW SUBMISSION
==========================================================

After clicking Submit For Review

Employee may notice a mistake.

If reviewer has NOT started reviewing

Employee may click

Withdraw Submission

Task returns to

In Progress

Submission disappears from reviewer queue.

Reviewer receives notification

Submission Withdrawn

If reviewer already opened review

Withdraw Submission becomes unavailable.

==========================================================
NOTIFICATION SYSTEM
==========================================================

Real-time in-app notifications.

Notification Center in top navigation.

Unread counter.

Notification Types

Task Assigned

Task Submitted

Waiting For Review

Task Approved

Task Rejected

Revision Requested

Submission Withdrawn

Task Due Today

Task Overdue

Workflow Started

Workflow Completed

Project Updated

Every notification opens related task.

==========================================================
DASHBOARDS
==========================================================

Employee Dashboard

My Tasks

Waiting Review

Completed

Notifications

Calendar

Team Lead Dashboard

My Tasks

Department Tasks

Department Progress

Overdue

Waiting Review

Admin Dashboard

Projects

Departments

Employees

Running Workflows

Pending Reviews

Reports

Analytics

Brand Overview

==========================================================
TASK VIEWS
==========================================================

Support only two task views.

List View

Board View

Board contains

Ready

In Progress

In Review

Completed

Cards move automatically.

Users cannot drag cards.

==========================================================
REPORTS
==========================================================

Keep reports simple.

Completed Tasks

Pending Tasks

Overdue Tasks

Department Performance

Employee Performance

Workflow Completion Rate

Brand Performance

==========================================================
ACTIVITY TIMELINE
==========================================================

Every task records activity.

Workflow Started

Task Assigned

Files Uploaded

Comment Added

Submitted

Withdrawn

Approved

Rejected

Revision Requested

Completed

Nothing is lost.

==========================================================
SEARCH
==========================================================

Global Search

Projects

Tasks

Employees

Departments

Workflow Templates

==========================================================
DESIGN STYLE
==========================================================

Modern

Minimal

Clean

Large spacing

Rounded corners

Soft shadows

Professional

Fast

Responsive

Very easy to understand.

No clutter.

No unnecessary buttons.

Maximum three clicks to complete any task.

==========================================================
IMPORTANT PRINCIPLES
==========================================================

Employees never manually assign the next employee.

Employees never drag task cards.

Workflow Builder is the only drag-and-drop feature.

Workflow automatically creates tasks.

Workflow automatically assigns tasks.

Workflow automatically changes task status.

Workflow automatically sends notifications.

Employees only see tasks assigned to them.

Team Leads use the exact same task interface as Team Members.

Admin controls the entire system.

The application should feel effortless, simple, and highly intuitive while remaining scalable for future departments, brands, and workflows.#   E m p l o y e e _ t a s k _ a u t o m a t i o n  
 