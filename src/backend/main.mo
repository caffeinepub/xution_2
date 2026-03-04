import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Int "mo:core/Int";



actor {
  // TYPES

  public type Member = {
    id : Text;
    name : Text;
    email : Text;
    role : Role;
    status : Status;
    joinedAt : Int;
    principal : Principal;
    idCardImage : ?Text;
  };

  module Member {
    public func compare(a : Member, b : Member) : Order.Order {
      switch (Text.compare(a.id, b.id)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type Role = {
    #admin;
    #member;
  };

  public type Status = {
    #active;
    #inactive;
    #suspended;
  };

  public type DM = {
    id : Text;
    fromMemberId : Text;
    toMemberId : Text;
    content : Text;
    sentAt : Int;
    read : Bool;
  };

  module DM {
    public func compare(a : DM, b : DM) : Order.Order {
      switch (Text.compare(a.id, b.id)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type Facility = {
    id : Text;
    name : Text;
    description : Text;
    location : Text;
    status : FacilityStatus;
    createdAt : Int;
  };

  module Facility {
    public func compare(a : Facility, b : Facility) : Order.Order {
      switch (Text.compare(a.id, b.id)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type FacilityStatus = {
    #available;
    #inUse;
    #maintenance;
  };

  public type Transaction = {
    id : Text;
    memberId : Text;
    facilityId : ?Text;
    amount : Int;
    description : Text;
    type_ : TransactionType;
    createdAt : Int;
  };

  module Transaction {
    public func compare(a : Transaction, b : Transaction) : Order.Order {
      switch (Text.compare(a.id, b.id)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type TransactionType = {
    #payment;
    #refund;
    #fee;
    #donation;
  };

  public type Policy = {
    id : Text;
    title : Text;
    content : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
    active : Bool;
  };

  module Policy {
    public func compare(a : Policy, b : Policy) : Order.Order {
      switch (Text.compare(a.category, b.category)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type Broadcast = {
    id : Text;
    title : Text;
    content : Text;
    authorId : Text;
    createdAt : Int;
    priority : BroadcastPriority;
  };

  module Broadcast {
    public func compare(a : Broadcast, b : Broadcast) : Order.Order {
      switch (Text.compare(a.title, b.title)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type BroadcastPriority = {
    #normal;
    #high;
    #urgent;
  };

  public type UserProfile = {
    name : Text;
    memberId : ?Text;
  };

  public type SessionData = {
    sessionType : Text;
    memberId : ?Text;
    createdAt : Int;
  };

  // STATE

  var password1 = "bacon";
  var password2 = "leviathan";

  let members = Map.empty<Text, Member>();
  let dms = Map.empty<Text, DM>();
  let facilities = Map.empty<Text, Facility>();
  let transactions = Map.empty<Text, Transaction>();
  let policies = Map.empty<Text, Policy>();
  let broadcasts = Map.empty<Text, Broadcast>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Text, SessionData>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var aboutText : Text = "Xution is a community management platform designed to enhance collaboration, communication, and resource management for organizations of all sizes.";
  var featuresList : [Text] = [
    "Member Management",
    "Direct Messaging",
    "Facility Booking",
    "Transaction Tracking",
    "Policy Management",
    "Broadcast Messaging",
    "Session Management"
  ];

  // USER PROFILE OPERATIONS

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ABOUT AND FEATURES

  public query ({ caller }) func getAboutText() : async Text {
    aboutText;
  };

  public shared ({ caller }) func updateAboutText(newText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update about text");
    };
    aboutText := newText;
  };

  public query ({ caller }) func getFeaturesList() : async [Text] {
    featuresList;
  };

  public shared ({ caller }) func updateFeaturesList(newFeatures : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update features list");
    };
    featuresList := newFeatures;
  };

  // HELPER FUNCTIONS

  func getMemberIdByPrincipal(principal : Principal) : ?Text {
    for ((id, member) in members.entries()) {
      if (Principal.equal(member.principal, principal)) {
        return ?id;
      };
    };
    null;
  };

  // OPERATIONS

  // Password Management
  public query ({ caller }) func verifyPassword(pw : Text) : async Bool {
    // No auth check - guests need to verify passwords to authenticate
    let normalizedPw = pw.toLower();
    normalizedPw == password1.toLower() or normalizedPw == password2.toLower();
  };

  public shared ({ caller }) func setPasswords(p1 : Text, p2 : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set passwords");
    };
    password1 := p1;
    password2 := p2;
  };

  public query ({ caller }) func getPasswords() : async (Text, Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get passwords");
    };
    (password1, password2);
  };

  // Members
  public shared ({ caller }) func createMember(id : Text, name : Text, email : Text, role : Role, principal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create members");
    };
    let member : Member = {
      id;
      name;
      email;
      role;
      status = #active;
      joinedAt = Time.now();
      principal;
      idCardImage = null;
    };
    if (members.containsKey(id)) { Runtime.trap("Member with id=" # id # " already exists") };
    members.add(id, member);
  };

  public shared ({ caller }) func setMemberIdCard(memberId : Text, imageDataUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set member id card images");
    };
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("No member with id=" # memberId) };
      case (?member) {
        let updatedMember : Member = { member with idCardImage = ?imageDataUrl };
        members.add(memberId, updatedMember);
      };
    };
  };

  public query ({ caller }) func getMemberByQrId(qrId : Text) : async ?Member {
    // No auth check - this is used for QR-based check-in/verification
    // The frontend has already verified the password or QR code
    let normalizedQrId = qrId.toLower();
    for ((_, member) in members.entries()) {
      if (member.id.toLower() == normalizedQrId) {
        return ?member;
      };
    };
    null;
  };

  public query ({ caller }) func getMember(id : Text) : async Member {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view members");
    };
    switch (members.get(id)) {
      case (null) { Runtime.trap("No member with id=" # id) };
      case (?member) { member };
    };
  };

  public query ({ caller }) func getAllMembers() : async [Member] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view members");
    };
    members.values().toArray().sort();
  };

  public shared ({ caller }) func updateMember(id : Text, name : Text, email : Text, role : Role) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update members");
    };
    switch (members.get(id)) {
      case (null) { Runtime.trap("No member with id=" # id) };
      case (?member) {
        let updatedMember : Member = {
          id;
          name;
          email;
          role;
          status = member.status;
          joinedAt = member.joinedAt;
          principal = member.principal;
          idCardImage = member.idCardImage;
        };
        members.add(id, updatedMember);
      };
    };
  };

  public shared ({ caller }) func deleteMember(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };
    if (not members.containsKey(id)) { Runtime.trap("No member with id=" # id) };
    members.remove(id);
  };

  // Direct Messages
  public shared ({ caller }) func sendDM(fromMemberId : Text, toMemberId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send DMs");
    };

    // Verify caller is the sender
    let callerMemberId = getMemberIdByPrincipal(caller);
    switch (callerMemberId) {
      case (null) { Runtime.trap("Caller is not a registered member") };
      case (?id) {
        if (id != fromMemberId) {
          Runtime.trap("Unauthorized: Can only send DMs from your own account");
        };
      };
    };

    // Verify both members exist
    if (not members.containsKey(fromMemberId)) {
      Runtime.trap("Sender member not found");
    };
    if (not members.containsKey(toMemberId)) {
      Runtime.trap("Recipient member not found");
    };

    let dmId = fromMemberId # toMemberId # Time.now().toText();
    let dm : DM = {
      id = dmId;
      fromMemberId;
      toMemberId;
      content;
      sentAt = Time.now();
      read = false;
    };
    dms.add(dmId, dm);
  };

  public query ({ caller }) func getDM(id : Text) : async DM {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view DMs");
    };

    switch (dms.get(id)) {
      case (null) { Runtime.trap("No DM with id=" # id) };
      case (?dm) {
        // Verify caller is sender or recipient or admin
        let callerMemberId = getMemberIdByPrincipal(caller);
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        switch (callerMemberId) {
          case (null) {
            if (not isAdmin) {
              Runtime.trap("Unauthorized: Only sender, recipient, or admin can view this DM");
            };
          };
          case (?id) {
            if (id != dm.fromMemberId and id != dm.toMemberId and not isAdmin) {
              Runtime.trap("Unauthorized: Only sender, recipient, or admin can view this DM");
            };
          };
        };
        dm;
      };
    };
  };

  public query ({ caller }) func getAllDMs() : async [DM] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view DMs");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerMemberId = getMemberIdByPrincipal(caller);

    if (isAdmin) {
      // Admins can see all DMs
      return dms.values().toArray().sort();
    };

    // Regular users can only see their own DMs
    switch (callerMemberId) {
      case (null) { [] };
      case (?memberId) {
        dms.values().toArray().filter(func(dm : DM) : Bool {
          dm.fromMemberId == memberId or dm.toMemberId == memberId
        }).sort();
      };
    };
  };

  public shared ({ caller }) func markDMAsRead(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark DMs as read");
    };

    switch (dms.get(id)) {
      case (null) { Runtime.trap("No DM with id=" # id) };
      case (?dm) {
        // Verify caller is the recipient
        let callerMemberId = getMemberIdByPrincipal(caller);
        switch (callerMemberId) {
          case (null) { Runtime.trap("Caller is not a registered member") };
          case (?id) {
            if (id != dm.toMemberId) {
              Runtime.trap("Unauthorized: Only the recipient can mark DM as read");
            };
          };
        };

        let updatedDM : DM = {
          dm with
          read = true;
        };
        dms.add(id, updatedDM);
      };
    };
  };

  // Facilities
  public shared ({ caller }) func addFacility(id : Text, name : Text, description : Text, location : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add facilities");
    };
    let facility : Facility = {
      id;
      name;
      description;
      location;
      status = #available;
      createdAt = Time.now();
    };
    facilities.add(id, facility);
  };

  public query ({ caller }) func getFacility(id : Text) : async Facility {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view facilities");
    };
    switch (facilities.get(id)) {
      case (null) { Runtime.trap("No facility with id=" # id) };
      case (?facility) { facility };
    };
  };

  public query ({ caller }) func getAllFacilities() : async [Facility] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view facilities");
    };
    facilities.values().toArray().sort();
  };

  public shared ({ caller }) func updateFacilityStatus(id : Text, status : FacilityStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update facility status");
    };
    switch (facilities.get(id)) {
      case (null) { Runtime.trap("No facility with id=" # id) };
      case (?facility) {
        let updatedFacility : Facility = {
          facility with status
        };
        facilities.add(id, updatedFacility);
      };
    };
  };

  public shared ({ caller }) func removeFacility(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove facilities");
    };
    if (not facilities.containsKey(id)) { Runtime.trap("No facility with id=" # id) };
    facilities.remove(id);
  };

  // Transactions
  public shared ({ caller }) func addTransaction(id : Text, memberId : Text, facilityId : ?Text, amount : Int, description : Text, type_ : TransactionType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };

    // Verify caller is the member or an admin
    let callerMemberId = getMemberIdByPrincipal(caller);
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    switch (callerMemberId) {
      case (null) {
        if (not isAdmin) {
          Runtime.trap("Unauthorized: Only the member or admin can add transactions");
        };
      };
      case (?id) {
        if (id != memberId and not isAdmin) {
          Runtime.trap("Unauthorized: Can only add transactions for yourself");
        };
      };
    };

    // Verify member exists
    if (not members.containsKey(memberId)) {
      Runtime.trap("Member not found");
    };

    let transaction : Transaction = {
      id;
      memberId;
      facilityId;
      amount;
      description;
      type_;
      createdAt = Time.now();
    };
    transactions.add(id, transaction);
  };

  public query ({ caller }) func getTransaction(id : Text) : async Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (transactions.get(id)) {
      case (null) { Runtime.trap("No transaction with id=" # id) };
      case (?transaction) {
        // Verify caller is the member or an admin
        let callerMemberId = getMemberIdByPrincipal(caller);
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        switch (callerMemberId) {
          case (null) {
            if (not isAdmin) {
              Runtime.trap("Unauthorized: Only the member or admin can view this transaction");
            };
          };
          case (?id) {
            if (id != transaction.memberId and not isAdmin) {
              Runtime.trap("Unauthorized: Can only view your own transactions");
            };
          };
        };
        transaction;
      };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let callerMemberId = getMemberIdByPrincipal(caller);

    if (isAdmin) {
      // Admins can see all transactions
      return transactions.values().toArray().sort();
    };

    // Regular users can only see their own transactions
    switch (callerMemberId) {
      case (null) { [] };
      case (?memberId) {
        transactions.values().toArray().filter(func(t : Transaction) : Bool {
          t.memberId == memberId
        }).sort();
      };
    };
  };

  // Policies
  public shared ({ caller }) func addPolicy(id : Text, title : Text, content : Text, category : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add policies");
    };
    let policy : Policy = {
      id;
      title;
      content;
      category;
      createdAt = Time.now();
      updatedAt = Time.now();
      active = true;
    };
    policies.add(id, policy);
  };

  public query ({ caller }) func getPolicy(id : Text) : async Policy {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view policies");
    };
    switch (policies.get(id)) {
      case (null) { Runtime.trap("No policy with id=" # id) };
      case (?policy) { policy };
    };
  };

  public query ({ caller }) func getAllPolicies() : async [Policy] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view policies");
    };
    policies.values().toArray().sort();
  };

  public shared ({ caller }) func updatePolicy(id : Text, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update policies");
    };
    switch (policies.get(id)) {
      case (null) { Runtime.trap("No policy with id=" # id) };
      case (?policy) {
        let updatedPolicy : Policy = {
          policy with
          title;
          content;
          updatedAt = Time.now();
        };
        policies.add(id, updatedPolicy);
      };
    };
  };

  public shared ({ caller }) func deactivatePolicy(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate policies");
    };
    switch (policies.get(id)) {
      case (null) { Runtime.trap("No policy with id=" # id) };
      case (?policy) {
        let updatedPolicy : Policy = {
          policy with active = false
        };
        policies.add(id, updatedPolicy);
      };
    };
  };

  // Broadcasts
  public shared ({ caller }) func createBroadcast(id : Text, title : Text, content : Text, authorId : Text, priority : BroadcastPriority) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create broadcasts");
    };
    let broadcast : Broadcast = {
      id;
      title;
      content;
      authorId;
      createdAt = Time.now();
      priority;
    };
    broadcasts.add(id, broadcast);
  };

  public query ({ caller }) func getBroadcast(id : Text) : async Broadcast {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view broadcasts");
    };
    switch (broadcasts.get(id)) {
      case (null) { Runtime.trap("No broadcast with id=" # id) };
      case (?broadcast) { broadcast };
    };
  };

  public query ({ caller }) func getAllBroadcasts() : async [Broadcast] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view broadcasts");
    };
    broadcasts.values().toArray().sort();
  };

  // SESSION MANAGEMENT
  // No auth checks - caller is trusted because password/QR already verified in frontend

  public shared ({ caller }) func createSession(token : Text, sessionType : Text, memberId : ?Text) : async () {
    let sessionData : SessionData = {
      sessionType;
      memberId;
      createdAt = Time.now();
    };
    sessions.add(token, sessionData);
  };

  public query ({ caller }) func validateSession(token : Text) : async ?SessionData {
    sessions.get(token);
  };

  public shared ({ caller }) func destroySession(token : Text) : async () {
    sessions.remove(token);
  };
};
