class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr), '------queryString---------');

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      console.log(this.queryString.sort, "--------------lllllllllllllllllllllllllllllllllll")
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy, 'PPPPPPPPPPPPPPPPPP');
      this.query = this.query.sort(sortBy);
      //if there is same value then in mongoose it is like:
      // sort('price ratingsAverage')  we will just add another property to the string
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }


  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginated() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
