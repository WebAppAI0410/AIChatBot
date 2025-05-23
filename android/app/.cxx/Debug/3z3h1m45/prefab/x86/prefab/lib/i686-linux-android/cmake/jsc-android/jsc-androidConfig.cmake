if(NOT TARGET jsc-android::jsc)
add_library(jsc-android::jsc SHARED IMPORTED)
set_target_properties(jsc-android::jsc PROPERTIES
    IMPORTED_LOCATION "C:/Users/33916/.gradle/caches/8.13/transforms/32f392cc979410f06e0d318d4b192f80/transformed/jsc-android-2026004.0.1/prefab/modules/jsc/libs/android.x86/libjsc.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/33916/.gradle/caches/8.13/transforms/32f392cc979410f06e0d318d4b192f80/transformed/jsc-android-2026004.0.1/prefab/modules/jsc/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

