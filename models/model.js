let Model = class Model {
  constructor(args) {

  }

  getOne() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  getAll() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  updateOne() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  updateAll() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  removeOne() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  removeAll() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  insertOne() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }
  insertAll() {
    throw new Error("This function has not been implemented. Please configure the Class.");
  }

  assignObjects(obj, assignments) {
    return Object.assign(obj, {
      collection: this.collection
    });
  }
}

module.exports = Model;