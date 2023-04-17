-- MySQL dump 10.13  Distrib 8.0.31, for macos13.0 (x86_64)
--
-- Host: localhost    Database: hclab
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `hclab`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `hclab` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `hclab`;

--
-- Table structure for table `angry`
--

DROP TABLE IF EXISTS `angry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `angry` (
  `recipientId` int DEFAULT NULL,
  `senderId` int DEFAULT NULL,
  `expiry` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `angry`
--

LOCK TABLES `angry` WRITE;
/*!40000 ALTER TABLE `angry` DISABLE KEYS */;
/*!40000 ALTER TABLE `angry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill`
--

DROP TABLE IF EXISTS `bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill` (
  `started` timestamp NULL DEFAULT NULL,
  `finished` timestamp NULL DEFAULT NULL,
  `chargePointId` int DEFAULT NULL,
  `connectorSerial` varchar(20) DEFAULT NULL,
  `ownerId` int DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `totalkWh` decimal(5,2) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `bulkSoc` decimal(5,2) DEFAULT NULL,
  `fullSoc` decimal(5,2) DEFAULT NULL,
  `avgKW` decimal(5,2) DEFAULT NULL,
  `trxId` int DEFAULT NULL,
  `meterStart` decimal(5,2) DEFAULT NULL,
  `meterStop` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill`
--

LOCK TABLES `bill` WRITE;
/*!40000 ALTER TABLE `bill` DISABLE KEYS */;
INSERT INTO `bill` VALUES ('2023-03-27 05:25:01',NULL,3333,'1',22,22,NULL,NULL,NULL,NULL,NULL,2,0.00,NULL),('2023-03-27 05:36:27',NULL,3333,'1',22,22,NULL,NULL,NULL,NULL,NULL,3,0.00,NULL),('2023-03-28 00:08:21',NULL,3333,'1',0,22,NULL,NULL,NULL,NULL,NULL,4,0.00,NULL),('2023-03-27 08:08:31',NULL,1111,'2',44,33,NULL,NULL,NULL,NULL,NULL,1,0.00,NULL),('2023-03-28 01:05:53',NULL,1111,'3',22,11,NULL,NULL,NULL,NULL,NULL,5,0.00,NULL),('2023-03-28 01:12:11',NULL,1111,'4',22,11,NULL,NULL,NULL,NULL,NULL,6,0.00,NULL),('2023-03-28 01:14:01',NULL,2222,'5',44,44,NULL,NULL,NULL,NULL,NULL,7,0.00,NULL),('2023-04-06 02:04:35',NULL,1111,'4',22,11,NULL,NULL,NULL,NULL,NULL,8,0.00,NULL),('2023-04-06 02:05:33',NULL,1111,'4',22,11,NULL,NULL,NULL,NULL,NULL,9,0.00,NULL),('2023-04-12 07:58:52',NULL,3333,'2',22,33,NULL,NULL,NULL,NULL,NULL,10,0.00,NULL),('2023-04-13 00:19:40',NULL,3333,'2',22,33,NULL,NULL,NULL,NULL,NULL,11,0.00,NULL),('2023-04-13 00:21:21',NULL,3333,'2',22,33,NULL,NULL,NULL,NULL,NULL,12,0.00,NULL),('2023-04-13 03:23:15',NULL,3333,'2',22,33,NULL,NULL,NULL,NULL,NULL,13,0.00,NULL),('2023-04-13 03:28:26',NULL,3333,'2',22,33,NULL,NULL,NULL,NULL,NULL,14,0.00,NULL),('2023-04-13 08:23:42',NULL,3333,'1',22,2,NULL,NULL,NULL,NULL,NULL,15,0.00,NULL),('2023-04-13 23:29:57',NULL,3333,'1',22,11,NULL,NULL,NULL,NULL,NULL,16,0.00,NULL),('2023-04-14 00:25:28','2023-04-14 00:25:40',1111,'3',22,33,NULL,NULL,NULL,NULL,NULL,17,0.00,NULL),('2023-04-14 01:15:58',NULL,3333,'2',22,44,NULL,NULL,NULL,NULL,NULL,18,0.00,NULL),('2023-04-14 04:12:54','2023-04-14 04:13:21',1111,'4',22,22,NULL,NULL,12.10,72.70,NULL,19,0.00,NULL),('2023-04-17 00:34:53','2023-04-17 00:35:29',4444,'14',44,55,NULL,NULL,12.10,72.70,NULL,20,0.00,NULL);
/*!40000 ALTER TABLE `bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chargepoint`
--

DROP TABLE IF EXISTS `chargepoint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chargepoint` (
  `chargePointId` int NOT NULL,
  `ownerId` int DEFAULT NULL,
  `chargePointName` varchar(40) DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `locationDetail` varchar(100) DEFAULT NULL,
  `priceHCL` int DEFAULT NULL,
  `priceHost` int DEFAULT NULL,
  `created` timestamp NULL DEFAULT NULL,
  `connectorsCount` smallint DEFAULT NULL,
  `model` varchar(20) DEFAULT NULL,
  `vendor` varchar(20) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `priceExtra` int DEFAULT NULL,
  `dynamicPricing` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`chargePointId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chargepoint`
--

LOCK TABLES `chargepoint` WRITE;
/*!40000 ALTER TABLE `chargepoint` DISABLE KEYS */;
INSERT INTO `chargepoint` VALUES (1111,22,'uiwang2',37.33,126.95,NULL,250,100,NULL,2,'hclab1','hclab',NULL,NULL,NULL),(2222,44,'uiwang3',37.32,126.94,NULL,250,10,NULL,1,'hclab1','hclab',NULL,NULL,NULL),(3333,22,'Uiwang',37.3255,126.952,'ground level 7',250,50,NULL,2,'hclab1','hclab',NULL,NULL,NULL),(4444,44,'uiwang4',37.29,126,'basement',250,40,'2023-04-14 04:16:57',4,'hclab1','hclab',NULL,NULL,NULL);
/*!40000 ALTER TABLE `chargepoint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `connector`
--

DROP TABLE IF EXISTS `connector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `connector` (
  `occupyingUserId` int DEFAULT NULL,
  `occupyingEnd` timestamp NULL DEFAULT NULL,
  `connectorSerial` varchar(20) DEFAULT NULL,
  `status` enum('Available','Preparing','Charging','SuspendedEVSE','SuspendedEV','Finishing','Reserved','Unavailable','Faulted') DEFAULT NULL,
  `connectorId` smallint DEFAULT NULL,
  `chargePointId` int DEFAULT NULL,
  `created` timestamp NULL DEFAULT NULL,
  `lastHeartBeat` timestamp NULL DEFAULT NULL,
  `ownerId` int DEFAULT NULL,
  `capacity` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connector`
--

LOCK TABLES `connector` WRITE;
/*!40000 ALTER TABLE `connector` DISABLE KEYS */;
INSERT INTO `connector` VALUES (22,NULL,'4','Finishing',2,1111,'2023-02-14 05:59:45','2023-04-14 04:52:09',22,NULL),(44,'2023-04-12 02:13:56','5','Reserved',1,2222,'2023-02-14 06:00:46','2023-03-21 05:13:56',44,NULL),(11,NULL,'1','Finishing',1,3333,'2023-01-03 05:00:00','2023-04-12 01:28:50',22,NULL),(44,NULL,'2','Charging',2,3333,'2023-01-03 05:00:00','2023-04-14 05:46:14',22,NULL),(33,NULL,'3','Finishing',1,1111,'2023-03-04 15:00:00','2023-03-22 00:34:00',22,NULL),(NULL,NULL,'10','Available',1,4444,'2023-04-14 04:21:15','2023-04-14 05:46:43',44,NULL),(NULL,NULL,'11',NULL,2,4444,'2023-04-14 04:21:22','2023-04-14 04:55:41',44,NULL),(NULL,NULL,'12',NULL,3,4444,'2023-04-14 04:21:27','2023-04-14 05:46:10',44,NULL),(55,NULL,'14','Finishing',4,4444,'2023-04-14 04:21:33','2023-04-17 00:52:02',44,NULL);
/*!40000 ALTER TABLE `connector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dynamicpricing`
--

DROP TABLE IF EXISTS `dynamicpricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dynamicpricing` (
  `chargePointId` int NOT NULL,
  PRIMARY KEY (`chargePointId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dynamicpricing`
--

LOCK TABLES `dynamicpricing` WRITE;
/*!40000 ALTER TABLE `dynamicpricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `dynamicpricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorite`
--

DROP TABLE IF EXISTS `favorite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorite` (
  `userId` int DEFAULT NULL,
  `chargePointId` int DEFAULT NULL,
  `favoriteOrder` tinyint DEFAULT NULL,
  `chargePointName` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorite`
--

LOCK TABLES `favorite` WRITE;
/*!40000 ALTER TABLE `favorite` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finishingalarm`
--

DROP TABLE IF EXISTS `finishingalarm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finishingalarm` (
  `connectorSerial` varchar(20) DEFAULT NULL,
  `userId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finishingalarm`
--

LOCK TABLES `finishingalarm` WRITE;
/*!40000 ALTER TABLE `finishingalarm` DISABLE KEYS */;
/*!40000 ALTER TABLE `finishingalarm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostaccounting`
--

DROP TABLE IF EXISTS `hostaccounting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostaccounting` (
  `userId` int NOT NULL,
  `chargePointId` int NOT NULL,
  `profitShareTo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`userId`,`chargePointId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostaccounting`
--

LOCK TABLES `hostaccounting` WRITE;
/*!40000 ALTER TABLE `hostaccounting` DISABLE KEYS */;
/*!40000 ALTER TABLE `hostaccounting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recent`
--

DROP TABLE IF EXISTS `recent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recent` (
  `userId` int DEFAULT NULL,
  `chargePointId` int DEFAULT NULL,
  `chargePointName` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recent`
--

LOCK TABLES `recent` WRITE;
/*!40000 ALTER TABLE `recent` DISABLE KEYS */;
INSERT INTO `recent` VALUES (44,3333,NULL);
/*!40000 ALTER TABLE `recent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userId` int NOT NULL,
  `phone` varchar(16) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `created` timestamp NULL DEFAULT NULL,
  `host` tinyint(1) DEFAULT NULL,
  `endPoint` varchar(200) DEFAULT NULL,
  `loggedIn` enum('none','android','ios','web') DEFAULT NULL,
  `credit` int DEFAULT NULL,
  `vin` varchar(18) DEFAULT NULL,
  `authStatus` enum('Accepted','Blocked','Expired') DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (11,'01011111111','1111@1111.com','2023-03-21 00:53:44',0,'11oneone11oneone','android',NULL,NULL,'Accepted'),(22,'01022222222','222@222.net','2023-03-21 00:54:37',1,'22twotwo22','web',NULL,NULL,'Accepted'),(33,'01033333333','222@222.net','2023-03-21 00:56:11',0,'33threethree33','android',3333,'EIOF2349EE','Blocked'),(44,'0104444444','444@444.io','2023-03-21 02:07:17',1,'44four44','ios',NULL,'UE238hfu','Accepted'),(55,'010555555','55@55.55','2023-04-14 04:28:38',0,NULL,'web',NULL,NULL,'Accepted');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useraccounting`
--

DROP TABLE IF EXISTS `useraccounting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraccounting` (
  `userId` int NOT NULL,
  `paymentKey` varchar(50) DEFAULT NULL,
  `cardNumber` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useraccounting`
--

LOCK TABLES `useraccounting` WRITE;
/*!40000 ALTER TABLE `useraccounting` DISABLE KEYS */;
/*!40000 ALTER TABLE `useraccounting` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-17 13:44:26
