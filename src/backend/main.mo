import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  // Initial State
  var password1 : Text = "bacon";
  var password2 : Text = "leviathan";
  var contactEmail : Text = "Gameloverv@gmail.com";
  var aboutText : Text = "Welcome to Xution";
  var featuresList : [Text] = [
    "Member Management",
    "Direct Messaging",
    "Facility Booking",
    "Transaction Tracking",
    "Policy Enforcement"
  ];

  // Persistent data stores
  let members = Map.empty<Text, Member>();
  let dms = Map.empty<Text, DM>();
  let facilities = Map.empty<Text, Facility>();
  let transactions = Map.empty<Text, Transaction>();
  let policies = Map.empty<Text, Policy>();
  let broadcasts = Map.empty<Text, Broadcast>();
  let sessions = Map.empty<Text, SessionData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Types
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

  public type Facility = {
    id : Text;
    name : Text;
    description : Text;
    location : Text;
    status : FacilityStatus;
    createdAt : Int;
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

  public type Broadcast = {
    id : Text;
    title : Text;
    content : Text;
    authorId : Text;
    createdAt : Int;
    priority : BroadcastPriority;
  };

  public type BroadcastPriority = {
    #normal;
    #high;
    #urgent;
  };

  public type SessionData = {
    sessionType : Text;
    memberId : ?Text;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
    memberId : ?Text;
  };

  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper function to get member ID from caller's principal
  func getMemberIdFromPrincipal(caller : Principal) : ?Text {
    // First check user profile
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.memberId };
      case (null) {
        // Search members by principal
        let membersArray = members.values().toArray();
        switch (membersArray.find(func(m) { m.principal == caller })) {
          case (?member) { ?member.id };
          case (null) { null };
        };
      };
    };
  };

  // Public Functions - No Auth Checks
  public query func verifyPassword(pw : Text) : async Bool {
    pw.toLower() == password1.toLower() or pw.toLower() == password2.toLower();
  };

  public shared func createSession(token : Text, sessionType : Text, memberId : ?Text) : async () {
    sessions.add(token, {
      sessionType;
      memberId;
      createdAt = 0; // Dummy timestamp, replace with real time if available
    });
  };

  public query func validateSession(token : Text) : async ?SessionData {
    sessions.get(token);
  };

  public shared func destroySession(token : Text) : async () {
    sessions.remove(token);
  };

  public query func getMemberByQrId(qrId : Text) : async ?Member {
    let searchId = qrId.toLower();
    let membersArray = members.values().toArray();
    switch (membersArray.find(func(m) { m.id.toLower() == searchId })) {
      case (?member) { ?member };
      case (null) { null };
    };
  };

  public query func getAboutText() : async Text {
    aboutText;
  };

  public query func getFeaturesList() : async [Text] {
    featuresList;
  };

  public query func getContactEmail() : async Text {
    contactEmail;
  };

  // Admin Only Functions
  public shared ({ caller }) func setPasswords(p1 : Text, p2 : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set passwords");
    };
    password1 := p1;
    password2 := p2;
  };

  public query ({ caller }) func getPasswords() : async (Text, Text) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get passwords");
    };
    (password1, password2);
  };

  public shared ({ caller }) func setContactEmail(email : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set contact email");
    };
    contactEmail := email;
  };

  public shared ({ caller }) func updateAboutText(newText : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update about text");
    };
    aboutText := newText;
  };

  public shared ({ caller }) func updateFeaturesList(newFeatures : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update features list");
    };
    featuresList := newFeatures;
  };

  public shared ({ caller }) func createMember(id : Text, name : Text, email : Text, role : Role, principal : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create members");
    };
    let newMember : Member = {
      id;
      name;
      email;
      role;
      status = #active;
      joinedAt = 0; // Dummy timestamp, replace with real time if available
      principal;
      idCardImage = null;
    };
    members.add(id, newMember);
  };

  public shared ({ caller }) func setMemberIdCard(memberId : Text, imageDataUrl : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set member ID card");
    };
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?member) {
        let updatedMember = {
          member with
          idCardImage = ?imageDataUrl
        };
        members.add(memberId, updatedMember);
      };
    };
  };

  public shared ({ caller }) func updateMember(id : Text, name : Text, email : Text, role : Role) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update members");
    };
    switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?member) {
        let updatedMember = {
          member with
          name;
          email;
          role;
        };
        members.add(id, updatedMember);
      };
    };
  };

  public shared ({ caller }) func deleteMember(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };
    members.remove(id);
  };

  public shared ({ caller }) func addFacility(id : Text, name : Text, description : Text, location : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add facilities");
    };
    let newFacility : Facility = {
      id;
      name;
      description;
      location;
      status = #available;
      createdAt = 0; // Dummy timestamp
    };
    facilities.add(id, newFacility);
  };

  public shared ({ caller }) func updateFacilityStatus(id : Text, status : FacilityStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update facility status");
    };
    switch (facilities.get(id)) {
      case (null) { Runtime.trap("Facility not found") };
      case (?facility) {
        let updatedFacility = {
          facility with
          status
        };
        facilities.add(id, updatedFacility);
      };
    };
  };

  public shared ({ caller }) func removeFacility(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can remove facilities");
    };
    facilities.remove(id);
  };

  public shared ({ caller }) func addPolicy(id : Text, title : Text, content : Text, category : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add policies");
    };
    let newPolicy : Policy = {
      id;
      title;
      content;
      category;
      createdAt = 0; // Dummy timestamp
      updatedAt = 0; // Dummy timestamp
      active = true;
    };
    policies.add(id, newPolicy);
  };

  public shared ({ caller }) func updatePolicy(id : Text, title : Text, content : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update policies");
    };
    switch (policies.get(id)) {
      case (null) { Runtime.trap("Policy not found") };
      case (?policy) {
        let updatedPolicy = {
          policy with
          title;
          content;
          updatedAt = 0; // Dummy timestamp
        };
        policies.add(id, updatedPolicy);
      };
    };
  };

  public shared ({ caller }) func deletePolicy(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete policies");
    };
    policies.remove(id);
  };

  public shared ({ caller }) func deactivatePolicy(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can deactivate policies");
    };
    policies.remove(id);
  };

  public shared ({ caller }) func createBroadcast(
    id : Text,
    title : Text,
    content : Text,
    authorId : Text,
    priority : BroadcastPriority,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create broadcasts");
    };
    let newBroadcast : Broadcast = {
      id;
      title;
      content;
      authorId;
      createdAt = 0; // Dummy timestamp
      priority;
    };
    broadcasts.add(id, newBroadcast);
  };

  // User Only Functions (Authenticated)
  public query ({ caller }) func getMember(id : Text) : async Member {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get members");
    };
    switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?member) { member };
    };
  };

  public query ({ caller }) func getAllMembers() : async [Member] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all members");
    };
    members.values().toArray();
  };

  public shared ({ caller }) func sendDM(fromMemberId : Text, toMemberId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send DMs");
    };
    
    // Verify caller owns the fromMemberId (unless admin)
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getMemberIdFromPrincipal(caller)) {
        case (?callerMemberId) {
          if (callerMemberId != fromMemberId) {
            Runtime.trap("Unauthorized: Cannot send DM from another member");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No member associated with caller");
        };
      };
    };
    
    switch (members.get(fromMemberId)) {
      case (null) { Runtime.trap("Sender not found") };
      case (?_) {
        let newDM : DM = {
          id = fromMemberId # toMemberId # (dms.size() + 1).toText();
          fromMemberId;
          toMemberId;
          content;
          sentAt = 0; // Dummy timestamp
          read = false;
        };
        dms.add(newDM.id, newDM);
      };
    };
  };

  public query ({ caller }) func getDM(id : Text) : async DM {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get DMs");
    };
    switch (dms.get(id)) {
      case (null) { Runtime.trap("DM not found") };
      case (?dm) {
        // Verify caller is involved in the DM (unless admin)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getMemberIdFromPrincipal(caller)) {
            case (?callerMemberId) {
              if (dm.fromMemberId != callerMemberId and dm.toMemberId != callerMemberId) {
                Runtime.trap("Unauthorized: Cannot access this DM");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: No member associated with caller");
            };
          };
        };
        dm;
      };
    };
  };

  public query ({ caller }) func getAllDMs() : async [DM] {
    let role = AccessControl.getUserRole(accessControlState, caller);

    if (role == #guest) {
      Runtime.trap("Unauthorized: Not a logged-in user");
    };

    // Admins: Return all DMs
    if (role == #admin) {
      return dms.values().toArray();
    };

    // Users: Only DMs related to the user
    switch (getMemberIdFromPrincipal(caller)) {
      case (?callerMemberId) {
        let filtered = dms.filter(
          func(k, dm) {
            dm.fromMemberId == callerMemberId or dm.toMemberId == callerMemberId
          }
        );
        filtered.values().toArray();
      };
      case (null) {
        Runtime.trap("Unauthorized: No member associated with caller");
      };
    };
  };

  public shared ({ caller }) func markDMAsRead(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark DMs as read");
    };
    switch (dms.get(id)) {
      case (null) { Runtime.trap("DM not found") };
      case (?dm) {
        // Verify caller is the recipient (unless admin)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getMemberIdFromPrincipal(caller)) {
            case (?callerMemberId) {
              if (dm.toMemberId != callerMemberId) {
                Runtime.trap("Unauthorized: Can only mark your own received DMs as read");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: No member associated with caller");
            };
          };
        };
        let updatedDM = {
          dm with read = true;
        };
        dms.add(id, updatedDM);
      };
    };
  };

  public query ({ caller }) func getFacility(id : Text) : async Facility {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get facilities");
    };
    switch (facilities.get(id)) {
      case (null) { Runtime.trap("Facility not found") };
      case (?facility) { facility };
    };
  };

  public query ({ caller }) func getAllFacilities() : async [Facility] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all facilities");
    };
    facilities.values().toArray();
  };

  public query ({ caller }) func getTransaction(id : Text) : async Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get transactions");
    };
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) {
        // Verify caller owns the transaction (unless admin)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (getMemberIdFromPrincipal(caller)) {
            case (?callerMemberId) {
              if (transaction.memberId != callerMemberId) {
                Runtime.trap("Unauthorized: Cannot access this transaction");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: No member associated with caller");
            };
          };
        };
        transaction;
      };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    let role = AccessControl.getUserRole(accessControlState, caller);

    if (role == #guest) {
      Runtime.trap("Unauthorized: Not a logged-in user");
    };

    // Admins: Return all transactions
    if (role == #admin) {
      return transactions.values().toArray();
    };

    // Users: Only transactions related to the user
    switch (getMemberIdFromPrincipal(caller)) {
      case (?callerMemberId) {
        let filtered = transactions.filter(
          func(k, t) { t.memberId == callerMemberId }
        );
        filtered.values().toArray();
      };
      case (null) {
        Runtime.trap("Unauthorized: No member associated with caller");
      };
    };
  };

  public shared ({ caller }) func addTransaction(
    id : Text,
    memberId : Text,
    facilityId : ?Text,
    amount : Int,
    description : Text,
    type_ : TransactionType,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };
    
    // Verify caller owns the memberId (unless admin)
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getMemberIdFromPrincipal(caller)) {
        case (?callerMemberId) {
          if (callerMemberId != memberId) {
            Runtime.trap("Unauthorized: Cannot add transaction for another member");
          };
        };
        case (null) {
          Runtime.trap("Unauthorized: No member associated with caller");
        };
      };
    };
    
    let newTransaction : Transaction = {
      id;
      memberId;
      facilityId;
      amount;
      description;
      type_;
      createdAt = 0; // Dummy timestamp
    };
    transactions.add(id, newTransaction);
  };

  public query ({ caller }) func getPolicy(id : Text) : async Policy {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get policies");
    };
    switch (policies.get(id)) {
      case (null) { Runtime.trap("Policy not found") };
      case (?policy) { policy };
    };
  };

  public query ({ caller }) func getAllPolicies() : async [Policy] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all policies");
    };
    policies.values().toArray();
  };

  public query ({ caller }) func getBroadcast(id : Text) : async Broadcast {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get broadcasts");
    };
    switch (broadcasts.get(id)) {
      case (null) { Runtime.trap("Broadcast not found") };
      case (?broadcast) { broadcast };
    };
  };

  public query ({ caller }) func getAllBroadcasts() : async [Broadcast] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all broadcasts");
    };
    broadcasts.values().toArray();
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
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

  // Virtual FS
  let tmpFS = List.empty<Nat8>();

  public shared ({ caller }) func saveTmpFS(fs : [Nat8]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    tmpFS.clear();
    tmpFS.addAll(fs.values());
  };

  public query ({ caller }) func loadTmpFS() : async [Nat8] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    tmpFS.toArray();
  };
};
