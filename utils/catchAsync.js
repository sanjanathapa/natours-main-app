module.exports = fn => {    
    return (req, res, next) => {
      fn(req, res, next).catch(next)
    }
  }

  //goal of this function is to simply catch our asynchrous errors.
  //.catch(err => next(err))