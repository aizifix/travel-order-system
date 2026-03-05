-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 05, 2026 at 11:00 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `travel_order_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `designation_id` int(11) NOT NULL,
  `designation_name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designations`
--

INSERT INTO `designations` (`designation_id`, `designation_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'COMPONENT HEAD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'DEPUTY PROJECT DIRECTOR', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'DIVISION CHIEF', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'OIC', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'RTD for Operation', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'RTD for Research and Regulation', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'UNIT HEAD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `division_id` int(11) NOT NULL,
  `division_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`division_id`, `division_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ADMIN AND FINANCE DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'AGRIBUSINESS AND MARKETING ASSISTANCE DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'FIELD OPERATIONS DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'INTEGRATED LABORATORIES DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'OFFICE OF THE REGIONAL EXECUTIVE DIRECTOR', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'OFFICE OF THE PROJECT DIRECTOR/DEPUTY PROJECT DIRECTOR (OPD/DPD)', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'PLANNING MONITORING AND EVALUATION DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(8, 'REGIONAL AGRICULTURAL AND FISHERY COUNCIL', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(9, 'REGIONAL CROP PROTECTION CENTER', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(10, 'REGIONAL AGRICULTURAL AND FISHERIES INFORMATION SECTION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(11, 'REGIONAL AGRICULTURAL ENGINEERING DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(12, 'REGULATORY DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(13, 'RESEARCH DIVISION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(14, 'MINDANAO INCLUSIVE AGRICULTURE DEVELOPMENT PROJECT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(15, 'PHILIPPINE RURAL DEVELOPMENT PROJECT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(16, 'MIADP Component 1: Ancestral Domain Planning and Social Preparation', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(17, 'MIADP Component 2: Resilient Ancestral Domain Agri-Fisheries Infrastructure', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(18, 'MIADP Component 3: Ancestral Domain Agri-Fisheries Production and Enterprise Development', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(19, 'MIADP Component 4: Project Management and Support, Monitoring, and Evaluation', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(20, 'MIADP M&E', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(21, 'MIADP SES', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(22, 'MIADP PROCUREMENT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(23, 'MIADP ADMIN and FINANCE', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(24, 'PRDP I-PLAN', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(25, 'PRDP I-BUILD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(26, 'PRDP I-REAP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(27, 'PRDP I-SUPPORT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(28, 'RTD for OPERATION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(29, 'RTD for RESEARCH and REGULATION', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `employment_statuses`
--

CREATE TABLE `employment_statuses` (
  `employment_status_id` int(11) NOT NULL,
  `employment_status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employment_statuses`
--

INSERT INTO `employment_statuses` (`employment_status_id`, `employment_status_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'REGULAR', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'CONTRACT OF SERVICE', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'JOB ORDER', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'PRDP-COS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'MIADP-COS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'GOVERNMENT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'PRIVATE', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'Recipient user',
  `travel_order_id` int(11) DEFAULT NULL COMMENT 'Related TO (optional)',
  `notification_title` varchar(255) NOT NULL,
  `notification_message` text NOT NULL,
  `notification_type` enum('INFO','APPROVAL','REJECTION','RETURN','SYSTEM') NOT NULL DEFAULT 'INFO',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `travel_order_id`, `notification_title`, `notification_message`, `notification_type`, `is_read`, `created_at`) VALUES
(1, 2, 5, 'TO-20260302-227448 submitted for your review', 'Mar Louis Go submitted a travel order to j.', 'APPROVAL', 1, '2026-03-02 08:06:36'),
(2, 20, 5, 'TO-20260302-227448 was rejected', 'Your travel order was rejected at step 1. Reason: Statements aren\'t clear yet', 'REJECTION', 1, '2026-03-02 08:07:50'),
(3, 2, 6, 'TO-20260302-118664 submitted for your review', 'Mar Louis Go submitted a travel order to j.', 'APPROVAL', 1, '2026-03-02 08:16:10'),
(4, 2, 7, 'TO-20260302-890887 submitted for your review', 'Mar Louis Go submitted a travel order to j.', 'APPROVAL', 1, '2026-03-02 08:16:42'),
(5, 2, 8, 'TO-20260302-138064 submitted for your review', 'Mar Louis Go submitted a travel order to Yes.', 'APPROVAL', 1, '2026-03-02 08:41:15'),
(6, 2, 9, 'TO-20260302-263728 submitted for your review', 'Mar Louis Go submitted a travel order to Yes.', 'APPROVAL', 1, '2026-03-02 08:41:55'),
(7, 20, 9, 'TO-20260302-263728 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-02 08:43:05'),
(8, 2, 10, 'TO-20260302-736564 submitted for your review', 'Mar Louis Go submitted a travel order to Yes.', 'APPROVAL', 1, '2026-03-02 09:00:48'),
(9, 2, 11, 'TO-20260304-638830 submitted for your review', 'Mar Louis Go submitted a travel order to Region 10 - Cagayan de Oro City.', 'APPROVAL', 1, '2026-03-04 03:07:38'),
(10, 2, 12, 'TO-20260304-392061 submitted for your review', 'Mar Louis Go submitted a travel order to Region 10 - Iligan City.', 'APPROVAL', 1, '2026-03-04 03:27:06'),
(11, 2, 13, 'TO-20260304-856443 submitted for your review', 'Mar Louis Go submitted a travel order to Region 10 - Cagayan de Oro City.', 'APPROVAL', 1, '2026-03-04 04:13:21'),
(12, 2, 14, 'TO-20260304-662203 submitted for your review', 'Mar Louis Go submitted a travel order to Carillo, Hagonoy, Bulacan, Region III (Central Luzon).', 'APPROVAL', 1, '2026-03-04 07:24:37'),
(13, 20, 14, 'TO-20260304-662203 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-04 07:27:24'),
(14, 14, 15, 'TO-20260305-339643 submitted for your review', 'Mar Louis Go submitted a travel order to Agguirit, Amulung, Cagayan, Region II (Cagayan Valley).', 'APPROVAL', 0, '2026-03-05 04:25:17'),
(15, 20, 15, 'TO-20260305-339643 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-05 05:05:09'),
(16, 2, 16, 'TO-20260305-508231 submitted for your review', 'Mar Louis Go submitted a travel order to Bacqui, Bacnotan, La Union, Region I (Ilocos Region).', 'APPROVAL', 1, '2026-03-05 05:21:09'),
(17, 1, 16, 'TO-20260305-508231 submitted for approval', 'Mar Louis Go submitted a travel order to Bacqui, Bacnotan, La Union, Region I (Ilocos Region).', 'INFO', 1, '2026-03-05 05:21:09'),
(18, 20, 16, 'TO-20260305-508231 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-05 05:21:41'),
(19, 2, 17, 'TO-20260305-375119 submitted for your review', 'Mar Louis Go submitted a travel order to Radiwan, Ivana, Batanes, Region II (Cagayan Valley).', 'APPROVAL', 1, '2026-03-05 06:31:32'),
(20, 1, 17, 'TO-20260305-375119 submitted for approval', 'Mar Louis Go submitted a travel order to Radiwan, Ivana, Batanes, Region II (Cagayan Valley).', 'INFO', 1, '2026-03-05 06:31:32'),
(21, 20, 17, 'TO-20260305-375119 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-05 06:33:13'),
(22, 2, 18, 'TO-20260305-381820 submitted for your review', 'Mar Louis Go submitted a travel order to Bulua, City of Cagayan De Oro, Misamis Oriental, Region X (Northern Mindanao).', 'APPROVAL', 1, '2026-03-05 06:39:51'),
(23, 1, 18, 'TO-20260305-381820 submitted for approval', 'Mar Louis Go submitted a travel order to Bulua, City of Cagayan De Oro, Misamis Oriental, Region X (Northern Mindanao).', 'INFO', 1, '2026-03-05 06:39:51'),
(24, 2, 19, 'TO-20260305-634217 submitted for your review', 'Mar Louis Go submitted a travel order to Manlamonay, Don Carlos, Bukidnon, Region X (Northern Mindanao).', 'APPROVAL', 1, '2026-03-05 21:00:59'),
(25, 1, 19, 'TO-20260305-634217 submitted for approval', 'Mar Louis Go submitted a travel order to Manlamonay, Don Carlos, Bukidnon, Region X (Northern Mindanao).', 'INFO', 1, '2026-03-05 21:01:00'),
(26, 20, 19, 'TO-20260305-634217 was approved', 'Your travel order was approved.', 'INFO', 1, '2026-03-05 21:03:26');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `position_id` int(11) NOT NULL,
  `position_name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`position_id`, `position_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Administrative Officer', 1, '2026-02-27 06:08:35', '2026-02-27 06:08:35'),
(2, 'Admin', 1, '2026-02-27 06:23:37', '2026-02-27 06:23:37');

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `program_id` int(11) NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `program_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '4Ks - FOD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'AMIA PROGRAM', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'BIDS and AWARDS COMMITTEE - GOODS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'CCAMIA', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'CERRMU/FOD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'CFIDP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'COA', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(8, 'CONVERGENCE', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(9, 'CORN', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(10, 'F2C2', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(11, 'FMRDP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(12, 'GAD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(13, 'HVCDP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(14, 'I-PLAN Component', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(15, 'LIVESTOCK', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(16, 'MIADP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(17, 'NUPAP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(18, 'OA', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(19, 'PRDP - IBUILD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(20, 'PRDP I-REAP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(21, 'PRDP I-SUPPORT', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(22, 'PRDP - RPCO', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(23, 'PRIME', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(24, 'PRISM', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(25, 'RICE', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(26, 'RSBSA', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(27, 'RSBSA - Geotagging', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(28, 'RSL', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(29, 'SAAD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(30, 'SPIS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(31, 'STO DOPP - FOD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(32, 'STO-ILD', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(33, 'TECHNOLOGY BUSINESS INCUBATION PROGRAM (TBI)', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(34, 'VPSS/IPM', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(35, 'YOUTH PARTICIPANTS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(36, 'VARIOUS', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(37, 'Other Programs and Projects', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(38, 'Others', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `transportations`
--

CREATE TABLE `transportations` (
  `transportation_id` int(11) NOT NULL,
  `transportation_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transportations`
--

INSERT INTO `transportations` (`transportation_id`, `transportation_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'PUJ/Bus', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'Plane', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'Boat', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'RP', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `travel_orders`
--

CREATE TABLE `travel_orders` (
  `travel_order_id` int(11) NOT NULL,
  `travel_order_no` varchar(50) NOT NULL,
  `travel_order_date` date NOT NULL DEFAULT curdate(),
  `requester_user_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `position_id` int(11) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `employment_status_id` int(11) NOT NULL,
  `travel_type_id` int(11) NOT NULL,
  `transportation_id` int(11) NOT NULL,
  `program_id` int(11) DEFAULT NULL,
  `travel_order_specDestination` text NOT NULL,
  `travel_order_specPurpose` text NOT NULL,
  `travel_order_fundingSource` varchar(120) DEFAULT NULL,
  `travel_order_remarks` varchar(120) DEFAULT NULL,
  `travel_order_days` int(11) NOT NULL DEFAULT 1,
  `travel_order_deptDate` date NOT NULL,
  `travel_order_returnDate` date NOT NULL,
  `has_other_staff` tinyint(1) NOT NULL DEFAULT 0,
  `travel_status_id` int(11) NOT NULL DEFAULT 1,
  `travel_status_remarks` varchar(120) DEFAULT NULL,
  `recommending_approver_id` int(11) DEFAULT NULL,
  `approved_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `travel_orders`
--

INSERT INTO `travel_orders` (`travel_order_id`, `travel_order_no`, `travel_order_date`, `requester_user_id`, `division_id`, `position_id`, `designation_id`, `employment_status_id`, `travel_type_id`, `transportation_id`, `program_id`, `travel_order_specDestination`, `travel_order_specPurpose`, `travel_order_fundingSource`, `travel_order_remarks`, `travel_order_days`, `travel_order_deptDate`, `travel_order_returnDate`, `has_other_staff`, `travel_status_id`, `travel_status_remarks`, `recommending_approver_id`, `approved_by_user_id`, `created_at`, `updated_at`) VALUES
(1, 'TO-20260301-644035', '2026-03-01', 20, 1, 1, 1, 2, 1, 3, NULL, 'A', 'A', 'A', 'A', 1, '2026-03-01', '2026-03-01', 0, 4, NULL, 2, 1, '2026-03-01 02:02:57', '2026-03-01 04:59:55'),
(2, 'TO-20260301-943928', '2026-03-01', 20, 1, 1, 1, 2, 2, 2, 24, 'Iligan City, Alienlife 3000', 'We are going to conduct a research and properly determine a rice field. So that we are able to conduct more research regarding this matter.', 'DA Region 10 Project', 'N/A Location/Venue: Cagayan de Oro City, 9000, Taj Mahal Objective(s): Create a UI/UX rice web design', 2, '2026-12-20', '2026-12-21', 0, 4, NULL, 2, 1, '2026-03-01 12:33:45', '2026-03-01 12:36:09'),
(3, 'TO-20260302-199496', '2026-03-02', 20, 1, 1, 1, 2, 7, 3, 9, 'Cagayan de Oro City, 9000', 'This is just a test for a new data. SM Uptown sangyupsalamat set. This is just another lorem ipsum test. No other explan', 'Region 10 Gcash', 'Location/Venue: Cagayan de Oro City, 9000 Objective(s): SM Uptown Sangyupsal Sets', 1, '2026-12-20', '2026-12-20', 0, 4, NULL, 2, 1, '2026-03-02 01:36:45', '2026-03-02 01:40:00'),
(4, 'TO-20260302-889387', '2026-03-02', 20, 1, 1, 1, 2, 3, 1, 1, 'Laguindingan City', 'Eggy yolk and pencil supplies, order with meals available tonight. Hello word in the light. Ngano kana mo pop-up barkada', 'President Donald Duck', 'Location/Venue: Cagayan de Oro City, 9000 Objective(s): Conduct a study about crops and farming on bulua laguindingan', 1, '2026-03-25', '2026-03-25', 0, 4, NULL, 2, 1, '2026-03-02 03:37:06', '2026-03-02 03:39:14'),
(5, 'TO-20260302-227448', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'j', 'Yes', 'DA', 'Location/Venue: CDO Objective(s): This is just a sample objective', 1, '2026-10-12', '2026-10-12', 0, 5, NULL, 2, NULL, '2026-03-02 08:06:36', '2026-03-02 08:07:50'),
(6, 'TO-20260302-118664', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'j', 'Yes', 'DA', 'Location/Venue: CDO Objective(s): This is just a sample objective', 1, '2026-12-20', '2026-12-20', 0, 7, 'Wrong request sorry :(', 2, NULL, '2026-03-02 08:16:10', '2026-03-04 00:03:40'),
(7, 'TO-20260302-890887', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'j', 'Yes', 'DA', 'Location/Venue: CDO Objective(s): This is just a sample objective', 1, '2026-12-21', '2026-12-21', 0, 2, NULL, 2, NULL, '2026-03-02 08:16:42', '2026-03-02 08:16:42'),
(8, 'TO-20260302-138064', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'Yes', 'Yummy', NULL, 'Location/Venue: Cagayqan Objective(s): Hotdogs', 1, '2026-12-26', '2026-12-26', 0, 7, 'Sorry for looking at your eyes without permission', 2, NULL, '2026-03-02 08:41:15', '2026-03-04 00:37:59'),
(9, 'TO-20260302-263728', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'Yes', 'Yummy', NULL, 'Location/Venue: Cagayqan Objective(s): Hotdogs', 1, '2026-12-26', '2026-12-26', 0, 4, NULL, 2, 1, '2026-03-02 08:41:55', '2026-03-02 08:43:05'),
(10, 'TO-20260302-736564', '2026-03-02', 20, 1, 1, 1, 2, 1, 3, NULL, 'Yes', 'Yummy', NULL, 'Location/Venue: Cagayqan Objective(s): Hotdogs', 1, '2026-12-26', '2026-12-26', 0, 3, NULL, 2, NULL, '2026-03-02 09:00:48', '2026-03-02 09:00:57'),
(11, 'TO-20260304-638830', '2026-03-04', 20, 1, 1, 1, 2, 1, 3, NULL, 'Region 10 - Cagayan de Oro City', 'Yes', NULL, NULL, 5, '2026-03-19', '2026-03-23', 0, 2, NULL, 2, NULL, '2026-03-04 03:07:38', '2026-03-04 03:07:38'),
(12, 'TO-20260304-392061', '2026-03-04', 20, 1, 1, 1, 2, 1, 3, NULL, 'Region 10 - Iligan City\nRegion 11 - Davao City', 'Seminar\nSeminar nasad', NULL, NULL, 4, '2026-03-01', '2026-04-03', 0, 7, NULL, 2, NULL, '2026-03-04 03:27:06', '2026-03-04 03:27:39'),
(13, 'TO-20260304-856443', '2026-03-04', 20, 1, 1, 1, 2, 1, 3, NULL, 'Region 10 - Cagayan de Oro City\nRegion 10 - Valencia City', 'Aa\nbbb', NULL, NULL, 5, '2026-03-01', '2026-03-06', 0, 2, NULL, 2, NULL, '2026-03-04 04:13:21', '2026-03-04 04:13:21'),
(14, 'TO-20260304-662203', '2026-03-04', 20, 1, 1, 1, 2, 1, 3, 3, 'Carillo, Hagonoy, Bulacan, Region III (Central Luzon)\nBinatagan, Basud, Camarines Norte, Region V (Bicol Region)\nBugwak, Dangcagan, Bukidnon, Region X (Northern Mindanao)', 'We are going to conduct a research\nRice fields\nCase study', 'To be announce', 'Objective(s): This is to certify that we are going to do that rice fields', 5, '2026-03-01', '2026-03-24', 0, 4, NULL, 2, 1, '2026-03-04 07:24:37', '2026-03-04 07:27:24'),
(15, 'TO-20260305-339643', '2026-03-05', 20, 1, 1, 1, 2, 3, 3, 3, 'Agguirit, Amulung, Cagayan, Region II (Cagayan Valley)\nAngadanan, Isabela, Region II (Cagayan Valley)\nAgani, Alcala, Cagayan, Region II (Cagayan Valley)\nPanatayan, Mahatao, Batanes, Region II (Cagayan Valley)', 'We are going to conduct a research for rice fields and other endeavors that needs to be face\nLand trip and other research to be conducted\nWe are going to conduct a study\nYes we are going to conduct a new research again in this location', NULL, NULL, 5, '2026-03-04', '2026-03-24', 0, 4, NULL, 2, 1, '2026-03-05 04:25:17', '2026-03-05 05:05:09'),
(16, 'TO-20260305-508231', '2026-03-05', 20, 1, 1, 1, 2, 1, 3, 6, 'Bacqui, Bacnotan, La Union, Region I (Ilocos Region)', 'Test notifications', NULL, 'Location', 3, '2026-03-03', '2026-03-05', 0, 4, NULL, 2, 1, '2026-03-05 05:21:09', '2026-03-05 05:21:41'),
(17, 'TO-20260305-375119', '2026-03-05', 20, 1, 1, 1, 2, 1, 2, 3, 'Radiwan, Ivana, Batanes, Region II (Cagayan Valley)', 'Hello me', NULL, NULL, 2, '2026-03-01', '2026-03-02', 0, 4, NULL, 2, 1, '2026-03-05 06:31:32', '2026-03-05 06:33:13'),
(18, 'TO-20260305-381820', '2026-03-05', 20, 1, 1, 1, 2, 5, 4, 15, 'Bulua, City of Cagayan De Oro, Misamis Oriental, Region X (Northern Mindanao)', 'wfwfqffqw', '1414', '24242 Objective(s): geojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeojgeoj', 2, '2026-03-06', '2026-03-07', 0, 7, NULL, 2, NULL, '2026-03-05 06:39:51', '2026-03-05 06:49:38'),
(19, 'TO-20260305-634217', '2026-03-06', 20, 1, 1, 1, 2, 1, 2, 2, 'Manlamonay, Don Carlos, Bukidnon, Region X (Northern Mindanao)', 'We are going for farms and hectars so that we can conduct more study there properly.', 'DA Region 10 Funds', 'Objective(s): We are going on a trip with our favorite rocket ship', 2, '2026-03-05', '2026-03-06', 0, 4, NULL, 2, 1, '2026-03-05 21:00:59', '2026-03-05 21:03:26');

-- --------------------------------------------------------

--
-- Table structure for table `travel_order_approvals`
--

CREATE TABLE `travel_order_approvals` (
  `approval_id` int(11) NOT NULL,
  `travel_order_id` int(11) NOT NULL,
  `step_no` int(11) NOT NULL COMMENT '1 = recommending approval, 2 = final approval',
  `approver_user_id` int(11) NOT NULL,
  `action` enum('APPROVED','REJECTED','RETURNED') NOT NULL,
  `remarks` text DEFAULT NULL,
  `action_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `travel_order_approvals`
--

INSERT INTO `travel_order_approvals` (`approval_id`, `travel_order_id`, `step_no`, `approver_user_id`, `action`, `remarks`, `action_at`) VALUES
(1, 1, 1, 2, 'APPROVED', NULL, '2026-03-01 04:51:38'),
(2, 1, 2, 1, 'APPROVED', NULL, '2026-03-01 04:59:55'),
(3, 2, 1, 2, 'APPROVED', NULL, '2026-03-01 12:35:06'),
(4, 2, 2, 1, 'APPROVED', NULL, '2026-03-01 12:36:09'),
(5, 3, 1, 2, 'APPROVED', NULL, '2026-03-02 01:39:49'),
(6, 3, 2, 1, 'APPROVED', NULL, '2026-03-02 01:40:00'),
(7, 4, 1, 2, 'APPROVED', NULL, '2026-03-02 03:38:16'),
(8, 4, 2, 1, 'APPROVED', NULL, '2026-03-02 03:39:14'),
(9, 5, 1, 2, 'REJECTED', 'Statements aren\'t clear yet', '2026-03-02 08:07:50'),
(10, 9, 1, 2, 'APPROVED', NULL, '2026-03-02 08:42:35'),
(11, 9, 2, 1, 'APPROVED', NULL, '2026-03-02 08:43:05'),
(12, 10, 1, 2, 'APPROVED', NULL, '2026-03-02 09:00:57'),
(13, 14, 1, 2, 'APPROVED', NULL, '2026-03-04 07:26:03'),
(14, 14, 2, 1, 'APPROVED', NULL, '2026-03-04 07:27:24'),
(15, 15, 1, 2, 'APPROVED', NULL, '2026-03-05 05:04:11'),
(16, 15, 2, 1, 'APPROVED', NULL, '2026-03-05 05:05:09'),
(17, 16, 1, 2, 'APPROVED', NULL, '2026-03-05 05:21:23'),
(18, 16, 2, 1, 'APPROVED', NULL, '2026-03-05 05:21:41'),
(19, 17, 1, 2, 'APPROVED', NULL, '2026-03-05 06:32:51'),
(20, 17, 2, 1, 'APPROVED', NULL, '2026-03-05 06:33:13'),
(21, 19, 1, 2, 'APPROVED', NULL, '2026-03-05 21:01:56'),
(22, 19, 2, 1, 'APPROVED', NULL, '2026-03-05 21:03:26');

-- --------------------------------------------------------

--
-- Table structure for table `travel_order_attachments`
--

CREATE TABLE `travel_order_attachments` (
  `attachment_id` int(11) NOT NULL,
  `travel_order_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT 'application/pdf',
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `travel_order_staff`
--

CREATE TABLE `travel_order_staff` (
  `travel_order_staff_id` int(11) NOT NULL,
  `travel_order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `travel_order_trips`
--

CREATE TABLE `travel_order_trips` (
  `trip_id` int(11) NOT NULL,
  `travel_order_id` int(11) NOT NULL,
  `trip_order` int(11) NOT NULL DEFAULT 1,
  `specific_destination` varchar(120) NOT NULL,
  `specific_purpose` varchar(120) NOT NULL,
  `departure_date` date NOT NULL,
  `return_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `travel_order_trips`
--

INSERT INTO `travel_order_trips` (`trip_id`, `travel_order_id`, `trip_order`, `specific_destination`, `specific_purpose`, `departure_date`, `return_date`, `created_at`) VALUES
(1, 11, 1, 'Region 10 - Cagayan de Oro City', 'Yes', '2026-03-19', '2026-03-23', '2026-03-04 03:07:38'),
(2, 12, 1, 'Region 10 - Iligan City', 'Seminar', '2026-03-01', '2026-03-01', '2026-03-04 03:27:06'),
(3, 12, 2, 'Region 11 - Davao City', 'Seminar nasad', '2026-04-01', '2026-04-03', '2026-03-04 03:27:06'),
(4, 13, 1, 'Region 10 - Cagayan de Oro City', 'Aa', '2026-03-01', '2026-03-02', '2026-03-04 04:13:21'),
(5, 13, 2, 'Region 10 - Valencia City', 'bbb', '2026-03-04', '2026-03-06', '2026-03-04 04:13:21'),
(6, 14, 1, 'Carillo, Hagonoy, Bulacan, Region III (Central Luzon)', 'We are going to conduct a research', '2026-03-01', '2026-03-01', '2026-03-04 07:24:37'),
(7, 14, 2, 'Binatagan, Basud, Camarines Norte, Region V (Bicol Region)', 'Rice fields', '2026-03-11', '2026-03-13', '2026-03-04 07:24:37'),
(8, 14, 3, 'Bugwak, Dangcagan, Bukidnon, Region X (Northern Mindanao)', 'Case study', '2026-03-24', '2026-03-24', '2026-03-04 07:24:37'),
(13, 15, 1, 'Agguirit, Amulung, Cagayan, Region II (Cagayan Valley)', 'We are going to conduct a research for rice fields and other endeavors that needs to be face', '2026-03-04', '2026-03-05', '2026-03-05 05:03:36'),
(14, 15, 2, 'Angadanan, Isabela, Region II (Cagayan Valley)', 'Land trip and other research to be conducted', '2026-03-10', '2026-03-10', '2026-03-05 05:03:36'),
(15, 15, 3, 'Agani, Alcala, Cagayan, Region II (Cagayan Valley)', 'We are going to conduct a study', '2026-03-11', '2026-03-11', '2026-03-05 05:03:36'),
(16, 15, 4, 'Panatayan, Mahatao, Batanes, Region II (Cagayan Valley)', 'Yes we are going to conduct a new research again in this location', '2026-03-24', '2026-03-24', '2026-03-05 05:03:36'),
(17, 16, 1, 'Bacqui, Bacnotan, La Union, Region I (Ilocos Region)', 'Test notifications', '2026-03-03', '2026-03-05', '2026-03-05 05:21:09'),
(18, 17, 1, 'Radiwan, Ivana, Batanes, Region II (Cagayan Valley)', 'Hello me', '2026-03-01', '2026-03-02', '2026-03-05 06:31:32'),
(19, 18, 1, 'Bulua, City of Cagayan De Oro, Misamis Oriental, Region X (Northern Mindanao)', 'wfwfqffqw', '2026-03-06', '2026-03-07', '2026-03-05 06:39:51'),
(20, 19, 1, 'Manlamonay, Don Carlos, Bukidnon, Region X (Northern Mindanao)', 'We are going for farms and hectars so that we can conduct more study there properly.', '2026-03-05', '2026-03-06', '2026-03-05 21:00:59');

-- --------------------------------------------------------

--
-- Table structure for table `travel_statuses`
--

CREATE TABLE `travel_statuses` (
  `travel_status_id` int(11) NOT NULL,
  `travel_status_name` varchar(100) NOT NULL,
  `travel_status_desc` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `travel_statuses`
--

INSERT INTO `travel_statuses` (`travel_status_id`, `travel_status_name`, `travel_status_desc`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DRAFT', 'Travel order created but not yet submitted', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'PENDING', 'Submitted and awaiting first approval', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'STEP1_APPROVED', 'Recommending approval granted, awaiting final approval', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'APPROVED', 'Final approval granted — ready for print/export', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'REJECTED', 'Travel order rejected by an approver', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'RETURNED', 'Returned to requester for revision', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'CANCELLED', 'Travel order cancelled by requester or admin', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(8, 'EXTENSION', 'Approved travel order extension', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(9, 'ADDITIONAL_DEST', 'Additional destinations to approved travel order', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(10, 'RESCHEDULED', 'Reschedule of cancelled travel order', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `travel_types`
--

CREATE TABLE `travel_types` (
  `travel_type_id` int(11) NOT NULL,
  `travel_type_name` varchar(200) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `travel_types`
--

INSERT INTO `travel_types` (`travel_type_id`, `travel_type_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Attendance to Trainings, Seminar', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(2, 'Facilitator to Training and Seminar', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(3, 'Monitoring of Programs/Projects', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(4, 'To accompany Visitors', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(5, 'To Submit Documents', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(6, 'To Transport Staff (for Drivers)', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(7, 'Other related Project Travel', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54'),
(8, 'Other related Travel', 1, '2026-02-26 07:12:54', '2026-02-26 07:12:54');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `user_firstName` varchar(100) NOT NULL,
  `user_lastName` varchar(100) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_password` varchar(255) NOT NULL,
  `user_role` enum('admin','approver','regular') NOT NULL DEFAULT 'regular',
  `user_isActive` tinyint(1) NOT NULL DEFAULT 1,
  `division_id` int(11) DEFAULT NULL,
  `position_id` int(11) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `employment_status_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `user_firstName`, `user_lastName`, `user_email`, `user_password`, `user_role`, `user_isActive`, `division_id`, `position_id`, `designation_id`, `employment_status_id`, `created_at`, `updated_at`) VALUES
(1, 'Jose Apollo', 'Pacamalan', 'admin@travelorder.gov.ph', '$2b$10$zl.5/0pRV6BOklktTF39RuKGLbKMLh3AE78R1.MnAiBNN1txnx/om', 'admin', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-27 02:45:54'),
(2, 'DELIZA', 'CAMARO', 'deliza.camaro@travelorder.gov.ph', '$2b$10$oelUc2Sl.8b.p8hvszLI5uIlbnLTIUICWqwryFUBN5se3rL3XVVoW', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 08:27:11'),
(3, 'GAY NANETTE', 'ALERIA', 'gaynanette.aleria@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(4, 'GLADYS', 'EMPERADO', 'gladys.emperado@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(5, 'FERDINAND', 'CARABALLE', 'ferdinand.caraballe@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(6, 'JESS ERICK', 'CO', 'jesserick.co@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(7, 'JOEL', 'RUDINAS', 'joel.rudinas@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(8, 'JULESBEN CAESAR', 'MAQUILING', 'julesben.maquiling@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(9, 'JUNEL', 'ABLANQUE', 'junel.ablanque@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(10, 'LANA MAY', 'RACINES', 'lanamay.racines@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(11, 'LORENA', 'DUNA', 'lorena.duna@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(12, 'LUCILLE', 'MINGUEZ', 'lucille.minguez@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(13, 'LUZ', 'GUZMAN', 'luz.guzman@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(14, 'MAE CARMELA', 'FABELA', 'maecarmela.fabela@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(15, 'MARY GRACE', 'STA. ELENA', 'marygrace.staelena@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(16, 'ORYZA KRISTY', 'BAYLO', 'oryzakristy.baylo@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(17, 'PATRICK IAN', 'PEDARSE', 'patrickian.pedarse@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(18, 'RICHELLE', 'WONG', 'richelle.wong@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(19, 'WILSON', 'LAGDAMIN', 'wilson.lagdamin@travelorder.gov.ph', '$2b$10$placeholder.hash.replace.in.production.000000000000000000', 'approver', 1, NULL, NULL, NULL, NULL, '2026-02-26 07:13:01', '2026-02-26 07:13:01'),
(20, 'Mar Louis', 'Go', 'margo@gmail.com', '$2b$12$NUL8GWhnKnBJSDc8Je.2HuniSh177Z6IW8hXcIYvbph8pj85n4MA6', 'regular', 1, 1, 1, 1, 2, '2026-02-27 06:08:35', '2026-02-27 06:08:35'),
(21, 'Kenneth Jhay Averruncus', 'Zarate', 'kenneth@gmail.com', '$2b$12$14CUksHr230w3Za70MubS.D3et7a1i81gi4hq5vcY57N6YWk6FDjC', 'approver', 1, 20, 2, 3, 2, '2026-02-27 06:23:37', '2026-02-27 06:23:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`designation_id`),
  ADD UNIQUE KEY `uq_designations_name` (`designation_name`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`division_id`),
  ADD UNIQUE KEY `uq_divisions_name` (`division_name`);

--
-- Indexes for table `employment_statuses`
--
ALTER TABLE `employment_statuses`
  ADD PRIMARY KEY (`employment_status_id`),
  ADD UNIQUE KEY `uq_employment_statuses_name` (`employment_status_name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_is_read` (`is_read`),
  ADD KEY `idx_notifications_created_at` (`created_at`),
  ADD KEY `fk_notifications_travel_order` (`travel_order_id`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`position_id`),
  ADD UNIQUE KEY `uq_positions_name` (`position_name`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`program_id`),
  ADD UNIQUE KEY `uq_programs_name` (`program_name`);

--
-- Indexes for table `transportations`
--
ALTER TABLE `transportations`
  ADD PRIMARY KEY (`transportation_id`),
  ADD UNIQUE KEY `uq_transportations_name` (`transportation_name`);

--
-- Indexes for table `travel_orders`
--
ALTER TABLE `travel_orders`
  ADD PRIMARY KEY (`travel_order_id`),
  ADD UNIQUE KEY `uq_travel_orders_no` (`travel_order_no`),
  ADD KEY `idx_travel_orders_requester` (`requester_user_id`),
  ADD KEY `idx_travel_orders_status` (`travel_status_id`),
  ADD KEY `idx_travel_orders_date` (`travel_order_date`),
  ADD KEY `idx_travel_orders_dept_date` (`travel_order_deptDate`),
  ADD KEY `fk_to_division` (`division_id`),
  ADD KEY `fk_to_position` (`position_id`),
  ADD KEY `fk_to_designation` (`designation_id`),
  ADD KEY `fk_to_employment_status` (`employment_status_id`),
  ADD KEY `fk_to_travel_type` (`travel_type_id`),
  ADD KEY `fk_to_transportation` (`transportation_id`),
  ADD KEY `fk_to_program` (`program_id`),
  ADD KEY `fk_to_recommending_approver` (`recommending_approver_id`),
  ADD KEY `fk_to_approved_by` (`approved_by_user_id`);

--
-- Indexes for table `travel_order_approvals`
--
ALTER TABLE `travel_order_approvals`
  ADD PRIMARY KEY (`approval_id`),
  ADD KEY `idx_approvals_travel_order` (`travel_order_id`),
  ADD KEY `idx_approvals_approver` (`approver_user_id`),
  ADD KEY `idx_approvals_action_at` (`action_at`);

--
-- Indexes for table `travel_order_attachments`
--
ALTER TABLE `travel_order_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `idx_attachments_travel_order` (`travel_order_id`),
  ADD KEY `idx_attachments_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `travel_order_staff`
--
ALTER TABLE `travel_order_staff`
  ADD PRIMARY KEY (`travel_order_staff_id`),
  ADD UNIQUE KEY `uq_to_staff` (`travel_order_id`,`user_id`),
  ADD KEY `idx_to_staff_user` (`user_id`);

--
-- Indexes for table `travel_order_trips`
--
ALTER TABLE `travel_order_trips`
  ADD PRIMARY KEY (`trip_id`),
  ADD UNIQUE KEY `uq_travel_order_trip_order` (`travel_order_id`,`trip_order`),
  ADD KEY `idx_trips_travel_order` (`travel_order_id`),
  ADD KEY `idx_trips_dates` (`departure_date`,`return_date`);

--
-- Indexes for table `travel_statuses`
--
ALTER TABLE `travel_statuses`
  ADD PRIMARY KEY (`travel_status_id`),
  ADD UNIQUE KEY `uq_travel_statuses_name` (`travel_status_name`);

--
-- Indexes for table `travel_types`
--
ALTER TABLE `travel_types`
  ADD PRIMARY KEY (`travel_type_id`),
  ADD UNIQUE KEY `uq_travel_types_name` (`travel_type_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_users_email` (`user_email`),
  ADD KEY `idx_users_role` (`user_role`),
  ADD KEY `idx_users_isActive` (`user_isActive`),
  ADD KEY `fk_users_division` (`division_id`),
  ADD KEY `fk_users_position` (`position_id`),
  ADD KEY `fk_users_designation` (`designation_id`),
  ADD KEY `fk_users_employment_status` (`employment_status_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `designation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `division_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `employment_statuses`
--
ALTER TABLE `employment_statuses`
  MODIFY `employment_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `position_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `program_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `transportations`
--
ALTER TABLE `transportations`
  MODIFY `transportation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `travel_orders`
--
ALTER TABLE `travel_orders`
  MODIFY `travel_order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `travel_order_approvals`
--
ALTER TABLE `travel_order_approvals`
  MODIFY `approval_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `travel_order_attachments`
--
ALTER TABLE `travel_order_attachments`
  MODIFY `attachment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `travel_order_staff`
--
ALTER TABLE `travel_order_staff`
  MODIFY `travel_order_staff_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `travel_order_trips`
--
ALTER TABLE `travel_order_trips`
  MODIFY `trip_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `travel_statuses`
--
ALTER TABLE `travel_statuses`
  MODIFY `travel_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `travel_types`
--
ALTER TABLE `travel_types`
  MODIFY `travel_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_travel_order` FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `travel_orders`
--
ALTER TABLE `travel_orders`
  ADD CONSTRAINT `fk_to_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`designation_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_employment_status` FOREIGN KEY (`employment_status_id`) REFERENCES `employment_statuses` (`employment_status_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_recommending_approver` FOREIGN KEY (`recommending_approver_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_requester` FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_transportation` FOREIGN KEY (`transportation_id`) REFERENCES `transportations` (`transportation_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_travel_status` FOREIGN KEY (`travel_status_id`) REFERENCES `travel_statuses` (`travel_status_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_travel_type` FOREIGN KEY (`travel_type_id`) REFERENCES `travel_types` (`travel_type_id`) ON UPDATE CASCADE;

--
-- Constraints for table `travel_order_approvals`
--
ALTER TABLE `travel_order_approvals`
  ADD CONSTRAINT `fk_approvals_approver` FOREIGN KEY (`approver_user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_approvals_travel_order` FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `travel_order_attachments`
--
ALTER TABLE `travel_order_attachments`
  ADD CONSTRAINT `fk_attachments_travel_order` FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attachments_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `travel_order_staff`
--
ALTER TABLE `travel_order_staff`
  ADD CONSTRAINT `fk_to_staff_travel_order` FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_to_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `travel_order_trips`
--
ALTER TABLE `travel_order_trips`
  ADD CONSTRAINT `fk_trip_travel_order` FOREIGN KEY (`travel_order_id`) REFERENCES `travel_orders` (`travel_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`designation_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_employment_status` FOREIGN KEY (`employment_status_id`) REFERENCES `employment_statuses` (`employment_status_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_position` FOREIGN KEY (`position_id`) REFERENCES `positions` (`position_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
