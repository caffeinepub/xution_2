import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  type Member = {
    id : Text;
    name : Text;
    email : Text;
    role : Role;
    status : Status;
    joinedAt : Int;
    principal : Principal;
    idCardImage : ?Text;
  };

  type Role = {
    #admin;
    #member;
  };

  type Status = {
    #active;
    #inactive;
    #suspended;
  };

  type DM = {
    id : Text;
    fromMemberId : Text;
    toMemberId : Text;
    content : Text;
    sentAt : Int;
    read : Bool;
  };

  type Facility = {
    id : Text;
    name : Text;
    description : Text;
    location : Text;
    status : FacilityStatus;
    createdAt : Int;
  };

  type FacilityStatus = {
    #available;
    #inUse;
    #maintenance;
  };

  type Transaction = {
    id : Text;
    memberId : Text;
    facilityId : ?Text;
    amount : Int;
    description : Text;
    type_ : TransactionType;
    createdAt : Int;
  };

  type TransactionType = {
    #payment;
    #refund;
    #fee;
    #donation;
  };

  type Policy = {
    id : Text;
    title : Text;
    content : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
    active : Bool;
  };

  type Broadcast = {
    id : Text;
    title : Text;
    content : Text;
    authorId : Text;
    createdAt : Int;
    priority : BroadcastPriority;
  };

  type BroadcastPriority = {
    #normal;
    #high;
    #urgent;
  };

  type UserProfile = {
    name : Text;
    memberId : ?Text;
  };

  type SessionData = {
    sessionType : Text;
    memberId : ?Text;
    createdAt : Int;
  };

  // Old actor type (from previous version)
  type OldActor = {
    aboutText : Text;
    broadcasts : Map.Map<Text, Broadcast>;
    dms : Map.Map<Text, DM>;
    facilities : Map.Map<Text, Facility>;
    featuresList : [Text];
    members : Map.Map<Text, Member>;
    password1 : Text;
    password2 : Text;
    policies : Map.Map<Text, Policy>;
    sessions : Map.Map<Text, SessionData>;
    transactions : Map.Map<Text, Transaction>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // New actor type (from current version)
  type NewActor = {
    password1 : Text;
    password2 : Text;
    contactEmail : Text;
    aboutText : Text;
    featuresList : [Text];
    members : Map.Map<Text, Member>;
    dms : Map.Map<Text, DM>;
    facilities : Map.Map<Text, Facility>;
    transactions : Map.Map<Text, Transaction>;
    policies : Map.Map<Text, Policy>;
    broadcasts : Map.Map<Text, Broadcast>;
    sessions : Map.Map<Text, SessionData>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  // Migration function called by main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    {
      password1 = old.password1;
      password2 = old.password2;
      contactEmail = "Gameloverv@gmail.com";
      aboutText = old.aboutText;
      featuresList = old.featuresList;
      members = old.members;
      dms = old.dms;
      facilities = old.facilities;
      transactions = old.transactions;
      policies = old.policies;
      broadcasts = old.broadcasts;
      sessions = old.sessions;
      userProfiles = old.userProfiles;
    };
  };
};
