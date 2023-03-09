package methods

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
)

func Float64ToInt64(num float64, retain int) int64 {
	return int64(num * math.Pow10(retain))
}

// func ConvertResponseJson(jsonStr []byte) (ResponseType, error) {
// 	var m ResponseType
// 	err := json.Unmarshal([]byte(jsonStr), &m)
// 	if err != nil {
// 		fmt.Printf("Unmarshal with error: %+v\n", err)
// 		return m, err
// 	}
// 	return m, nil
// }

func Reverse(s string) string {
	a := []rune(s)
	for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
		a[i], a[j] = a[j], a[i]
	}
	return string(a)
}

func JsonToMap(jsonStr string) (map[string]interface{}, error) {
	m := make(map[string]interface{})
	err := json.Unmarshal([]byte(jsonStr), &m)
	if err != nil {
		fmt.Printf("Unmarshal with error: %+v\n", err)
		return nil, err
	}
	return m, nil
}

// Convert map json string
func MapToJson(m map[string]string) (string, error) {
	jsonByte, err := json.Marshal(m)
	if err != nil {
		fmt.Printf("Marshal with error: %+v\n", err)
		return "", nil
	}

	return string(jsonByte), nil
}

func Contains(arr []int64, item int64) bool {
	for _, v := range arr {
		if v == item {
			return true
		}
	}

	return false
}
func DedupeArrayInt64(arr []int64) (newArr []int64) {
	for _, item := range arr {
		if isExist := Contains(newArr, item); !isExist {
			newArr = append(newArr, item)
		}
	}
	return
}
func StringOr(value *string, fields ...string) {
	for _, item := range fields {
		if item != "" {
			*value = item
			break
		}
	}
}

func FormatInt64ArrToString(arr []int64, sep string) string {
	var result string
	for _, i := range arr {
		str := strconv.FormatInt(i, 10)
		result += str + sep
	}

	return result
}

func UserIdsSortFromSmallToBig(userIds []int64) []int64 {
	// fmt.Println(userIds)
	sort.SliceStable(userIds, func(i, j int) bool {
		return userIds[i] < userIds[j]
	})

	return userIds
}

func GetRoomId(appId string, ids ...string) {
	// ids.sort((a, b) => {
	// 	return compareUnicodeOrder(a, b)
	// })

	// return cipher.MD5(appId + ids.join(''))
}

// func Gin(){
// 	return
// }

// func Contains(arrayType interface{}, item interface{}) bool {
// 	arr := reflect.ValueOf(arrayType)
// 	itemType := reflect.ValueOf(item.(int64))

// 	fmt.Println(arr.Kind(), itemType.Kind(), reflect.Slice)
// 	if arr.Kind() != reflect.Slice {
// 		panic("Invalid data-type")
// 	}

// 	for i := 0; i < arr.Len(); i++ {

// 		iType := reflect.ValueOf(arr.Index(i).Interface().(int64))
// 		fmt.Println(iType.Kind(), itemType.Kind())
// 		// fmt.Println(arr.Index(i), item, iType.Kind(), itemType.Kind())
// 		// fmt.Println(arr.Index(i) == item)
// 		if arr.Index(i).Interface() == item {
// 			return true
// 		}
// 	}

// 	return false
// }
