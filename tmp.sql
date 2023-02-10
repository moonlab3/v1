/*
alter table chargepoint change ownerid ownerId int;
alter table chargepoint change locationdetail locationDetail varchar(100);
alter table chargepoint change numberofconnectors connectorsCount smallint;
alter table chargepoint change imagepath imagePath varchar(100);
alter table chargepoint change paybackaccount profitShareTo carchar(50);

alter table connector change chargepointid chargePointId int;
alter table connector change occupyinguserid occupyingUserId int;
alter table connector change occupyingend occupyingEnd timestamp(6);
alter table connector change connectorserial connectorSerial varchar(20);
alter table connector change connectorid connectorId smallint;

alter table user change userid userId int;
alter table user change cardnumber cardNumber varchar(16);
alter table user change endpoint endPoint varchar(200);
alter table user change loggedin loggedIn enum ('none', 'android', 'ios', 'web');

alter table bill change chargepointid chargePointId int;
alter table bill change connectorserial connectorSerial varchar(20);
alter table bill change ownerid ownerId int;
alter table bill change userid userId int;
*/

alter table favorite change userid userId int;
alter table favorite change chargepointid chargePointId int;
alter table favorite change favoriteorder favoriteOrder tinyint;
alter table angry change recipientid recipientId int;
alter table angry change senderid senderId int;
alter table finishingalarm change connectorserial connectorSerial varchar(20);
alter table finishingalarm change userid userId int;