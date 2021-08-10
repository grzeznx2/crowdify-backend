module.exports = class {
    constructor(queryObj, Model) {
        this.queryObj = queryObj
        this.Model = Model
        this.query = null
    }

    filter() {
        const excludedFields = {
            sort: true,
            limit: true,
            page: true,
            fields: true,
            countDocuments: true
        }

        let filterObj = { ...this.queryObj }

        Object.keys(filterObj).forEach(key => {
            if (excludedFields[key]) delete filterObj[key]
            else {
                filterObj[key] = typeof filterObj[key] === 'string' ? filterObj[key].replace('_', ' ').split(',') : filterObj[key]
            }
        })

        let queryStr = JSON.stringify(filterObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        filterObj = JSON.parse(queryStr)
        console.log(this.queryObj)
        this.resultsCountQuery = this.queryObj.hasOwnProperty('countDocuments') ? this.Model.countDocuments(filterObj) : null
        // this.resultsCountQuery = this.queryObj.countDocuments === 'true' ? this.Model.countDocuments(filterObj) : null

        this.query = this.Model.find(filterObj)
        return this
    }

    sort() {
        let sortBy

        if (this.queryObj.sort) {
            sortBy = this.queryObj.sort.split(',').join(' ')
        } else {
            sortBy = '-createdAt'
        }

        this.query = this.query.sort(sortBy)

        return this
    }

    limit() {
        let limitStr = ''
        if (this.queryObj.fields) {
            limitStr = this.queryObj.fields.split(',').join(' ')
        } else {
            limitStr = '-__v'
        }

        this.query = this.query.select(limitStr)

        return this
    }

    paginate() {
        const getFieldValue = (field, defaultValue) => {
            if (this.queryObj[field]) {
                if (this.queryObj[field] * 1 > 0) return this.queryObj[field] * 1
            }
            return defaultValue
        }
        let page = getFieldValue('page', 1)
        let limit = getFieldValue('limit', 20)
        const skipBy = (page * limit) - limit

        this.query = this.query.skip(skipBy).limit(limit)

        return this
    }

}