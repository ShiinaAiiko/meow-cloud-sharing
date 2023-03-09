package validationv2

import (
	"errors"
	"reflect"
	"strconv"

	"github.com/cherrai/nyanyago-utils/nlog"
	"github.com/cherrai/nyanyago-utils/nstrings"
)

var (
	Log = nlog.New()
)

type (
	FieldRules struct {
		field string
		value interface{}
		rules []Rule
	}
	Rule interface {
		// Required(fieldPtr string, value interface{}) string
		// Length(value interface{}) string
		Validate(field string, value interface{}) error
		// call()
	}
)

func Validation(fields ...*FieldRules) error {
	// fmt.Println(fields...)
	err := ValidateStructWithContext(fields...)
	return err
}
func Field(key string, value interface{}, rules ...Rule) *FieldRules {
	// for _, item := range rules {
	// 	fmt.Println(item)
	// }
	return &FieldRules{
		field: key,
		value: value,
		rules: rules,
	}
}

func ValidateStructWithContext(fields ...*FieldRules) error {
	var errAll = ""
	for _, item := range fields {
		// fmt.Println(item)
		for _, subItem := range item.rules {
			err := subItem.Validate(item.field, item.value)
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
	EnumType struct {
		Enums interface{}
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

func Enum(enums interface{}) Rule {
	var rule Rule
	rule = EnumType{
		Enums: enums,
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
func (l EnumType) Validate(field string, v interface{}) error {
	value := reflect.ValueOf(l.Enums)
	isExist := false
	enumStr := ""
	for i := 0; i < value.Len(); i++ {
		enumStr += nstrings.ToString(value.Index(i).Interface())
		if i != value.Len()-1 {
			enumStr += ", "
		}
		if value.Index(i).Kind().String() == reflect.TypeOf(v).String() && nstrings.ToString(value.Index(i).Interface()) == nstrings.ToString(v) {
			isExist = true
			break
		}
	}
	if isExist {
		return nil
	}
	return errors.New("“" + field + "”: The value is not in the enumeration range, the enumeration range: " + enumStr + ".")
}
