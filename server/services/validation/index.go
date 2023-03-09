package validation

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
)

type (
	FieldRules struct {
		field string
		rules []Rule
	}
	Rule interface {
		// Required(fieldPtr string, value interface{}) string
		// Length(value interface{}) string
		Validate(field string, value interface{}) error
		// call()
	}
)

func Validation(c *gin.Context, fields ...*FieldRules) error {
	// fmt.Println(fields...)
	err := ValidateStructWithContext(c, fields...)
	return err
}
func Field(value string, rules ...Rule) *FieldRules {
	// for _, item := range rules {
	// 	fmt.Println(item)
	// }
	return &FieldRules{
		field: value,
		rules: rules,
	}
}

func ValidateStructWithContext(c *gin.Context, fields ...*FieldRules) error {
	var errAll = ""
	for _, item := range fields {
		// fmt.Println(item)
		for _, subItem := range item.rules {
			var value string

			switch c.Request.Method {
			case "GET":
				value = c.Query(item.field)
				if value == "" {
					value = c.GetString(item.field)
				}
				break

			case "POST":
				value = c.PostForm(item.field)
				if value == "" {
					value = c.GetString(item.field)
				}
				break
			default:
				break
			}
			err := subItem.Validate(item.field, value)
			if err != nil {
				errAll = errAll + err.Error()
			}
		}
	}
	if errAll == "" {
		return nil
	}
	return errors.New(errAll)
}

type (
	RequiredType struct {
	}

	NumRangeType struct {
		min int64
		max int64
	}
)

func Required() Rule {
	var rule Rule
	rule = new(RequiredType)
	return rule
}

func NumRange(min int64, max int64) Rule {
	var rule Rule
	rule = NumRangeType{
		min: min,
		max: max,
	}
	return rule
}

// fieldPtr string,
func (r RequiredType) Validate(field string, value interface{}) error {
	// fmt.Println("是否填写 value:", r, value)
	if value == "" {
		return errors.New("“" + field + "”: cannot be blank. ")
	}
	return nil
}

func (l NumRangeType) Validate(field string, value interface{}) error {
	// fmt.Println("长度 value:", l, value)

	val, _ := strconv.ParseInt(value.(string), 10, 64)
	if val >= l.min && val < l.max {
		return nil
	}
	// return errors.New(field + "不满足大小哦")
	return errors.New("“" + field + "”: Must be greater than " + strconv.FormatInt(l.min, 10) + " and less than " + strconv.FormatInt(l.max, 10) + ". ")
}
